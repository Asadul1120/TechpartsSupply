"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type TicketStatus = "Processing" | "Open" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Emergency";
type TicketFilter = "All" | "Open" | "Closed";

type Ticket = {
  id: number;
  date: string;
  subject: string;
  department: string;
  priority: TicketPriority;
  email: string;
  status: TicketStatus;
  customerName?: string;
  phone?: string;
  orderNumber?: string;
  message?: string;
};

type TicketsApiResponse = {
  success: boolean;
  total: number;
  data: Ticket[];
  message?: string;
};

const priorityStyles: Record<TicketPriority, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  High: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  Emergency: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

const statusStyles: Record<TicketStatus, string> = {
  Processing: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  Open: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Closed: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TicketFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTickets = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tickets", {
        method: "GET",
        cache: "no-store",
        signal,
      });

      const result: TicketsApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load tickets.");
      }

      setTickets(result.data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Fetch tickets error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading tickets.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetchTickets(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchTickets, refreshKey]);

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesQuery = [
        String(ticket.id),
        ticket.subject,
        ticket.department,
        ticket.email,
        ticket.priority,
        ticket.status,
        ticket.customerName ?? "",
        ticket.orderNumber ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesFilter =
        filter === "All" ||
        (filter === "Open" && ticket.status !== "Closed") ||
        (filter === "Closed" && ticket.status === "Closed");

      return matchesQuery && matchesFilter;
    });
  }, [tickets, query, filter]);

  function refreshTickets() {
    setQuery("");
    setFilter("All");
    setRefreshKey((current) => current + 1);
  }

  const openCount = tickets.filter(
    (ticket) => ticket.status !== "Closed",
  ).length;

  const closedCount = tickets.filter(
    (ticket) => ticket.status === "Closed",
  ).length;

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">
            CUSTOMER SERVICE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Support Department
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage customer requests and track support tickets.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

          <span className="text-sm text-slate-600">
            Welcome back,{" "}
            <span className="font-semibold text-slate-900">Return</span>
          </span>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Tickets"
          value={tickets.length}
          description="All support requests"
        />

        <StatCard
          label="Open Tickets"
          value={openCount}
          description="Awaiting resolution"
        />

        <StatCard
          label="Closed Tickets"
          value={closedCount}
          description="Completed requests"
        />
      </div>

      {/* Ticket Table Card */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Support Tickets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search, review and manage your tickets.
            </p>
          </div>

          <Link
            href="/tickets/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <span className="text-lg leading-none">+</span>
            New Ticket
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <label
            htmlFor="ticket-search"
            className="block text-sm font-semibold text-slate-700"
          >
            Search Tickets
          </label>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              id="ticket-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ticket number, subject, department or email..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

            <div className="flex flex-wrap items-center gap-2">
              {(["All", "Open", "Closed"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    filter === item
                      ? "bg-blue-700 text-white shadow-sm"
                      : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item === "All"
                    ? "All Tickets"
                    : item === "Open"
                      ? "View Open"
                      : "View Closed"}
                </button>
              ))}

              <button
                type="button"
                onClick={refreshTickets}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ↻ {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 sm:px-6">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {filteredTickets.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {tickets.length}
            </span>{" "}
            tickets
          </p>

          <span className="text-xs text-slate-400">Live API data</span>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-6"
          >
            <p className="font-semibold">Unable to load tickets</p>
            <p className="mt-1">{error}</p>

            <button
              type="button"
              onClick={refreshTickets}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Ticket #</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">From</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="font-semibold text-slate-800">
                      Loading tickets...
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Please wait while we retrieve your tickets.
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="transition hover:bg-blue-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-5 text-slate-500">
                      {formatDate(ticket.date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-bold text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        #{ticket.id}
                      </Link>
                    </td>

                    <td className="px-5 py-5">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-semibold text-slate-800 hover:text-blue-700"
                      >
                        {ticket.subject}
                      </Link>
                    </td>

                    <td className="px-5 py-5 text-slate-600">
                      {ticket.department}
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          priorityStyles[ticket.priority]
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td className="px-5 py-5 text-slate-600">{ticket.email}</td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusStyles[ticket.status]
                        }`}
                      >
                        <span className="mr-1.5">●</span>
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))}

              {!loading && !error && filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="font-semibold text-slate-800">
                      No tickets found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search term or filter.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setFilter("All");
                      }}
                      className="mt-4 text-sm font-semibold text-blue-700 hover:underline"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-4 sm:px-6">
          <p className="text-xs text-slate-500">
            Ticket information is retrieved from your tickets API.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
