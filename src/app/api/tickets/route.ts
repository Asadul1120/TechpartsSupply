import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";


const filePath = path.join(process.cwd(), "data", "tickets.json");

type TicketPriority = "Low" | "Medium" | "High" | "Emergency";

type TicketStatus = "Open" | "Processing" | "Closed";

interface Ticket {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  subject: string;
  department: string;
  priority: TicketPriority;
  status: TicketStatus;
  orderNumber: string;
  message: string;
  replies: {
    id: number;
    message: string;
    createdAt: string;
  }[];
  date: string;
}

// Read tickets from JSON file
async function readTickets(): Promise<Ticket[]> {
  const fileContent = await readFile(filePath, "utf-8");

  return JSON.parse(fileContent) as Ticket[];
}

// Write tickets to JSON file
async function writeTickets(tickets: Ticket[]): Promise<void> {
  await writeFile(filePath, JSON.stringify(tickets, null, 2), "utf-8");
}

// GET /api/tickets
export async function GET(request: NextRequest) {
  try {
    const tickets = await readTickets();

    const { searchParams } = request.nextUrl;

    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    let filteredTickets = [...tickets];

    // Search by subject, customer name, or email
    if (search) {
      filteredTickets = filteredTickets.filter((ticket) =>
        [ticket.subject, ticket.customerName, ticket.email].some((value) =>
          value.toLowerCase().includes(search),
        ),
      );
    }

    // Filter by status
    if (status && status !== "All") {
      filteredTickets = filteredTickets.filter(
        (ticket) => ticket.status === status,
      );
    }

    // Filter by priority
    if (priority && priority !== "All") {
      filteredTickets = filteredTickets.filter(
        (ticket) => ticket.priority === priority,
      );
    }

    return NextResponse.json({
      success: true,
      total: filteredTickets.length,
      data: filteredTickets,
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
    const requiredFields = {
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

    // Validate email
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 },
      );
    }

    // Validate priority
    const allowedPriorities: TicketPriority[] = [
      "Low",
      "Medium",
      "High",
      "Emergency",
    ];

    if (
      typeof priority !== "string" ||
      !allowedPriorities.includes(priority as TicketPriority)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid priority value.",
        },
        { status: 400 },
      );
    }

    const tickets = await readTickets();

    const nextId =
      tickets.length > 0
        ? Math.max(...tickets.map((ticket) => ticket.id)) + 1
        : 1;

    const newTicket: Ticket = {
      id: nextId,
      customerName: (customerName as string).trim(),
      email: (email as string).trim().toLowerCase(),
      phone: typeof phone === "string" ? phone.trim() : "",
      subject: (subject as string).trim(),
      department: (department as string).trim(),
      priority: priority as TicketPriority,
      status: "Open",
      orderNumber: typeof orderNumber === "string" ? orderNumber.trim() : "",
      message: (message as string).trim(),
      replies: [],
      date: new Date().toISOString(),
    };

    tickets.unshift(newTicket);

    await writeTickets(tickets);

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
  }
}
