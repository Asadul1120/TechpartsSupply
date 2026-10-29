import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { PoolClient } from "pg";

// export const runtime = "nodejs";

type TicketPriority = "Low" | "Medium" | "High" | "Emergency";

type TicketStatus = "Open" | "Processing" | "Closed";

interface TicketRow {
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
  replies?: {
    id: number;
    message: string;
    createdAt: string;
  }[];
}

function formatTicket(ticket: TicketRow) {
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
    replies: ticket.replies ?? [],
    date:
      ticket.created_at instanceof Date
        ? ticket.created_at.toISOString()
        : new Date(ticket.created_at).toISOString(),
  };
}

// GET /api/tickets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "All";
    const priority = searchParams.get("priority") ?? "All";

    const conditions: string[] = [];
    const values: string[] = [];

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          subject ILIKE $${values.length}
          OR customer_name ILIKE $${values.length}
          OR email ILIKE $${values.length}
        )
      `);
    }

    if (status !== "All") {
      const allowedStatuses: TicketStatus[] = ["Open", "Processing", "Closed"];

      if (!allowedStatuses.includes(status as TicketStatus)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid status value.",
          },
          { status: 400 },
        );
      }

      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (priority !== "All") {
      const allowedPriorities: TicketPriority[] = [
        "Low",
        "Medium",
        "High",
        "Emergency",
      ];

      if (!allowedPriorities.includes(priority as TicketPriority)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid priority value.",
          },
          { status: 400 },
        );
      }

      values.push(priority);
      conditions.push(`priority = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query<TicketRow>(
      `
        SELECT
          id,
          customer_name,
          email,
          phone,
          subject,
          department,
          priority,
          status,
          order_number,
          message,
          created_at
        FROM tickets
        ${whereClause}
        ORDER BY created_at DESC, id DESC
      `,
      values,
    );

    const tickets = result.rows.map(formatTicket);

    return NextResponse.json({
      success: true,
      total: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error("GET tickets error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve tickets.",
      },
      { status: 500 },
    );
  }
}

// POST /api/tickets
export async function POST(request: NextRequest) {
  let client: PoolClient | undefined;

  try {
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 },
      );
    }

    const {
      customerName,
      email,
      phone,
      subject,
      department,
      priority,
      orderNumber,
      message,
    } = body;

    // Validate required fields
    const requiredFields: Record<string, unknown> = {
      customerName,
      email,
      subject,
      department,
      priority,
      message,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} is required.`,
          },
          { status: 400 },
        );
      }
    }

    const cleanEmail = (email as string).trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    const allowedPriorities: TicketPriority[] = [
      "Low",
      "Medium",
      "High",
      "Emergency",
    ];

    if (!allowedPriorities.includes(priority as TicketPriority)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid priority value.",
        },
        { status: 400 },
      );
    }

    const cleanCustomerName = (customerName as string).trim();
    const cleanSubject = (subject as string).trim();
    const cleanDepartment = (department as string).trim();
    const cleanMessage = (message as string).trim();

    if (
      !cleanCustomerName ||
      !cleanSubject ||
      !cleanDepartment ||
      !cleanMessage
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields cannot be empty.",
        },
        { status: 400 },
      );
    }

    client = await pool.connect();

    const result = await client.query<TicketRow>(
      `
        INSERT INTO tickets (
          customer_name,
          email,
          phone,
          subject,
          department,
          priority,
          status,
          order_number,
          message
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'Open', $7, $8)
        RETURNING
          id,
          customer_name,
          email,
          phone,
          subject,
          department,
          priority,
          status,
          order_number,
          message,
          created_at
      `,
      [
        cleanCustomerName,
        cleanEmail,
        typeof phone === "string" ? phone.trim() || null : null,
        cleanSubject,
        cleanDepartment,
        priority,
        typeof orderNumber === "string" ? orderNumber.trim() || null : null,
        cleanMessage,
      ],
    );

    const newTicket = formatTicket(result.rows[0]);

    return NextResponse.json(
      {
        success: true,
        message: "Ticket created successfully.",
        data: newTicket,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create ticket.",
      },
      { status: 500 },
    );
  } finally {
    client?.release();
  }
}
