import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { PoolClient } from "pg";



type TicketStatus = "Open" | "Processing" | "Closed";

type TicketPriority = "Low" | "Medium" | "High" | "Emergency";

type TicketRow = {
  id: number;
  customer_name: string;
  email: string;
  phone: string | null;
  subject: string;
  department: string;
  priority: TicketPriority;
  status: TicketStatus;
  order_number: string | null;
  message: string;
  created_at: Date | string;
  updated_at: Date | string;
  attachment_name?: string | null;
  attachment_url?: string | null;
  attachment_size?: number | null;
  attachment_type?: string | null;
};

type ReplyRow = {
  id: number;
  ticket_id: number;
  sender: string;
  role: "Staff" | "Customer";
  message: string;
  created_at: Date | string;
};

type UpdateTicketBody = {
  status?: unknown;
  reply?: unknown;
  closeAfterReply?: unknown;
};

const TICKET_STATUSES: TicketStatus[] = ["Open", "Processing", "Closed"];

function getDateString(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function formatReply(reply: ReplyRow) {
  return {
    id: reply.id,
    sender: reply.sender,
    role: reply.role,
    message: reply.message,
    createdAt: getDateString(reply.created_at),
  };
}

function formatTicket(ticket: TicketRow, replies: ReplyRow[] = []) {
  return {
    id: ticket.id,
    customerName: ticket.customer_name,
    email: ticket.email,
    phone: ticket.phone ?? "",
    subject: ticket.subject,
    department: ticket.department,
    priority: ticket.priority,
    status: ticket.status,
    orderNumber: ticket.order_number ?? "",
    message: ticket.message,
    date: getDateString(ticket.created_at),
    replies: replies.map(formatReply),
    ...(ticket.attachment_name
      ? {
          attachment: {
            name: ticket.attachment_name,
            url: ticket.attachment_url ?? "",
            size: ticket.attachment_size ?? 0,
            type: ticket.attachment_type ?? "",
          },
        }
      : {}),
  };
}

async function getTicketId(
  params: Promise<{ id: string }>,
): Promise<number | null> {
  const { id } = await params;
  const ticketId = Number(id);

  return Number.isSafeInteger(ticketId) && ticketId > 0 ? ticketId : null;
}

// GET /api/tickets/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ticketId = await getTicketId(params);

    if (ticketId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ticket ID.",
        },
        { status: 400 },
      );
    }

    const ticketResult = await pool.query<TicketRow>(
      `
        SELECT *
        FROM tickets
        WHERE id = $1
        LIMIT 1
      `,
      [ticketId],
    );

    if (ticketResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found.",
        },
        { status: 404 },
      );
    }

    const repliesResult = await pool.query<ReplyRow>(
      `
        SELECT *
        FROM ticket_replies
        WHERE ticket_id = $1
        ORDER BY created_at ASC, id ASC
      `,
      [ticketId],
    );

    const ticket = formatTicket(ticketResult.rows[0], repliesResult.rows);

    return NextResponse.json(
      {
        success: true,
        data: ticket,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Get ticket by ID error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load this ticket right now.",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/tickets/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let client: PoolClient | undefined;

  try {
    const ticketId = await getTicketId(params);

    if (ticketId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ticket ID.",
        },
        { status: 400 },
      );
    }

    let body: UpdateTicketBody;

    try {
      body = (await request.json()) as UpdateTicketBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Request body must be valid JSON.",
        },
        { status: 400 },
      );
    }

    const hasStatus = body.status !== undefined;
    const hasReply = body.reply !== undefined;

    if (!hasStatus && !hasReply) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide a status update or a reply.",
        },
        { status: 400 },
      );
    }

    if (hasStatus && !TICKET_STATUSES.includes(body.status as TicketStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ticket status.",
        },
        { status: 400 },
      );
    }

    if (
      body.closeAfterReply !== undefined &&
      typeof body.closeAfterReply !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "closeAfterReply must be a boolean.",
        },
        { status: 400 },
      );
    }

    let replyText = "";

    if (hasReply) {
      if (typeof body.reply !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Reply must be text.",
          },
          { status: 400 },
        );
      }

      replyText = body.reply.trim();

      if (!replyText) {
        return NextResponse.json(
          {
            success: false,
            message: "Reply cannot be empty.",
          },
          { status: 400 },
        );
      }

      if (replyText.length > 3000) {
        return NextResponse.json(
          {
            success: false,
            message: "Reply must be 3000 characters or fewer.",
          },
          { status: 400 },
        );
      }
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const ticketResult = await client.query<TicketRow>(
      `
        SELECT *
        FROM tickets
        WHERE id = $1
        FOR UPDATE
      `,
      [ticketId],
    );

    if (ticketResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found.",
        },
        { status: 404 },
      );
    }

    const existingTicket = ticketResult.rows[0];

    if (hasReply && existingTicket.status === "Closed" && !hasStatus) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "This ticket is closed. Reopen it before replying.",
        },
        { status: 409 },
      );
    }

    let updatedStatus: TicketStatus = hasStatus
      ? (body.status as TicketStatus)
      : existingTicket.status;

    if (hasReply && body.closeAfterReply === true) {
      updatedStatus = "Closed";
    }

    if (updatedStatus !== existingTicket.status) {
      await client.query(
        `
          UPDATE tickets
          SET status = $1,
              updated_at = NOW()
          WHERE id = $2
        `,
        [updatedStatus, ticketId],
      );
    }

    if (hasReply) {
      await client.query(
        `
          INSERT INTO ticket_replies (
            ticket_id,
            sender,
            role,
            message
          )
          VALUES ($1, $2, $3, $4)
        `,
        [ticketId, "Support Staff", "Staff", replyText],
      );
    }

    const updatedTicketResult = await client.query<TicketRow>(
      `
        SELECT *
        FROM tickets
        WHERE id = $1
      `,
      [ticketId],
    );

    const repliesResult = await client.query<ReplyRow>(
      `
        SELECT *
        FROM ticket_replies
        WHERE ticket_id = $1
        ORDER BY created_at ASC, id ASC
      `,
      [ticketId],
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Ticket updated successfully.",
        data: formatTicket(updatedTicketResult.rows[0], repliesResult.rows),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Update ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update this ticket right now.",
      },
      { status: 500 },
    );
  } finally {
    client?.release();
  }
}
