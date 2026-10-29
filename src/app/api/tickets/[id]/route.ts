import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type TicketStatus = "Open" | "Processing" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Emergency";

type TicketReply = {
  id: number;
  sender: string;
  role: "Staff" | "Customer";
  message: string;
  createdAt: string;
};

type Ticket = {
  id: number;
  date: string;
  subject: string;
  department: string;
  priority: TicketPriority;
  email: string;
  status: TicketStatus;
  customerName: string;
  phone?: string;
  orderNumber?: string;
  message: string;
  replies?: unknown[];
};

type UpdateTicketBody = {
  status?: unknown;
  reply?: unknown;
  closeAfterReply?: unknown;
};

const TICKET_STATUSES: TicketStatus[] = ["Open", "Processing", "Closed"];

const DATA_FILE = path.join(process.cwd(), "data", "tickets.json");

async function readTickets(): Promise<Ticket[]> {
  const content = await readFile(DATA_FILE, "utf8");
  const data: unknown = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error("The tickets data file must contain a JSON array.");
  }

  return data as Ticket[];
}

async function getTicketId(
  params: Promise<{ id: string }>,
): Promise<number | null> {
  const { id } = await params;
  const ticketId = Number(id);

  return Number.isSafeInteger(ticketId) && ticketId > 0 ? ticketId : null;
}

// GET: Get a ticket by ID
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

    const tickets = await readTickets();

    const ticket = tickets.find((item) => Number(item.id) === ticketId);

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found.",
        },
        { status: 404 },
      );
    }

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

// PATCH: Update ticket status or add a reply
export async function PATCH(
  request: Request,
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

    const tickets = await readTickets();

    const ticketIndex = tickets.findIndex(
      (item) => Number(item.id) === ticketId,
    );

    if (ticketIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found.",
        },
        { status: 404 },
      );
    }

    const existingTicket = tickets[ticketIndex];

    const currentReplies: unknown[] = Array.isArray(existingTicket.replies)
      ? existingTicket.replies
      : [];

    const updatedTicket: Ticket = {
      ...existingTicket,
    };

    if (hasStatus) {
      updatedTicket.status = body.status as TicketStatus;
    }

    if (hasReply) {
      if (existingTicket.status === "Closed" && !hasStatus) {
        return NextResponse.json(
          {
            success: false,
            message: "This ticket is closed. Reopen it before replying.",
          },
          { status: 409 },
        );
      }

      const newReply: TicketReply = {
        id: Date.now(),
        sender: "Support Staff",
        role: "Staff",
        message: replyText,
        createdAt: new Date().toISOString(),
      };

      updatedTicket.replies = [...currentReplies, newReply];

      if (body.closeAfterReply === true) {
        updatedTicket.status = "Closed";
      }
    }

    tickets[ticketIndex] = updatedTicket;

    await writeFile(DATA_FILE, `${JSON.stringify(tickets, null, 2)}\n`, "utf8");

    return NextResponse.json(
      {
        success: true,
        message: "Ticket updated successfully.",
        data: updatedTicket,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Update ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update this ticket right now.",
      },
      { status: 500 },
    );
  }
}
