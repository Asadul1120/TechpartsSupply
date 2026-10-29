"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type TicketDetailsProps = {
  ticketId: string;
};

type TicketStatus = "Open" | "Processing" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Emergency";

type TicketReply =
  | string
  | {
      id?: number | string;
      sender?: string;
      role?: string;
      message?: string;
      date?: string;
      createdAt?: string;
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
  replies?: TicketReply[];
};

type ApiResult = {
  success: boolean;
  message?: string;
  data?: Ticket;
};

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-green-100 text-green-700",
  Processing: "bg-blue-100 text-blue-700",
  Closed: "bg-gray-200 text-gray-700",
};

const priorityStyles: Record<TicketPriority, string> = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-orange-100 text-orange-800",
  Emergency: "bg-red-100 text-red-800",
};

export default function TicketDetails({ ticketId }: TicketDetailsProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [closeAfterReply, setCloseAfterReply] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingReply, setSavingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  // Load ticket details from API
  const loadTicket = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/tickets/${encodeURIComponent(ticketId)}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const result = (await response.json()) as ApiResult;

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "Could not load this ticket.");
        }

        setTicket(result.data);
      } catch (caughtError) {
        if (caughtError instanceof Error && caughtError.name === "AbortError") {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Something went wrong while loading the ticket.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [ticketId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadTicket(controller.signal);

    return () => controller.abort();
  }, [loadTicket]);

  // Update status or send a reply through API
  async function updateTicket(body: {
    status?: TicketStatus;
    reply?: string;
    closeAfterReply?: boolean;
  }) {
    const response = await fetch(
      `/api/tickets/${encodeURIComponent(ticketId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const result = (await response.json()) as ApiResult;

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || "Could not update this ticket.");
    }

    setTicket(result.data);

    return result.data;
  }

  // Submit reply
  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = reply.trim();

    if (!message || savingReply || !ticket || ticket.status === "Closed") {
      return;
    }

    setSavingReply(true);
    setActionError("");
    setNotice("");

    try {
      await updateTicket({
        reply: message,
        closeAfterReply,
      });

      setReply("");
      setCloseAfterReply(false);

      setNotice(
        closeAfterReply
          ? "Reply posted and ticket closed."
          : "Reply posted successfully.",
      );
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to post reply.",
      );
    } finally {
      setSavingReply(false);
    }
  }

  // Close or reopen ticket
  async function handleStatusToggle() {
    if (!ticket || updatingStatus) {
      return;
    }

    const nextStatus: TicketStatus =
      ticket.status === "Closed" ? "Open" : "Closed";

    setUpdatingStatus(true);
    setActionError("");
    setNotice("");

    try {
      await updateTicket({
        status: nextStatus,
      });

      setNotice(
        nextStatus === "Closed"
          ? "Ticket closed successfully."
          : "Ticket reopened successfully.",
      );
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update ticket status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-700" />

        <p className="mt-4 text-sm text-gray-600">Loading ticket details...</p>
      </div>
    );
  }

  // Error or ticket not found
  if (error || !ticket) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold text-gray-900">
          Unable to load ticket
        </h1>

        <p role="alert" className="mt-3 text-sm leading-6 text-red-700">
          {error || "The requested ticket could not be found."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Back to Tickets
          </Link>

          <button
            type="button"
            onClick={() => void loadTicket()}
            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  const replies = ticket.replies ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            ← Back to Tickets
          </Link>

          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Ticket #{ticket.id}
          </h1>

          <p className="mt-1 text-sm text-gray-500">{ticket.subject}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[ticket.status]}`}
          >
            {ticket.status}
          </span>

          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${priorityStyles[ticket.priority]}`}
          >
            {ticket.priority} Priority
          </span>
        </div>
      </div>

      {/* Ticket Information */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Ticket Information</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Ticket Number" value={`#${ticket.id}`} />

          <InfoItem label="Priority" value={ticket.priority} />

          <InfoItem label="Department" value={ticket.department} />

          <InfoItem label="Created Date" value={formatDate(ticket.date)} />

          <InfoItem
            label="Customer Name"
            value={ticket.customerName || "Not provided"}
          />

          <InfoItem label="Email" value={ticket.email || "Not provided"} />

          <InfoItem label="Phone" value={ticket.phone || "Not provided"} />

          <InfoItem
            label="Order Number"
            value={ticket.orderNumber || "Not provided"}
          />
        </div>
      </section>

      {/* Conversation */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Conversation</h2>

          <p className="mt-1 text-sm text-gray-500">
            Customer and support staff messages
          </p>
        </div>

        <div className="space-y-5 p-5">
          {/* Original customer message */}
          <article className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {ticket.customerName || "Customer"}
                </h3>

                <p className="text-xs text-gray-500">Customer</p>
              </div>

              <time className="text-xs text-gray-500">
                {formatDate(ticket.date)}
              </time>
            </div>

            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
              {ticket.message || "No message provided."}
            </p>
          </article>

          {/* Saved replies */}
          {replies.map((item, index) => {
            const isString = typeof item === "string";

            const replyItem = isString ? null : item;

            const messageText = isString ? item : (replyItem?.message ?? "");

            const author = isString
              ? "Support Staff"
              : replyItem?.sender || "Support Staff";

            const messageDate = isString
              ? ""
              : replyItem?.createdAt || replyItem?.date || "";

            const isCustomer = !isString && replyItem?.role === "Customer";

            return (
              <article
                key={
                  isString
                    ? `reply-${index}`
                    : (replyItem?.id ?? `reply-${index}`)
                }
                className={`rounded-lg border p-4 ${
                  isCustomer
                    ? "border-blue-100 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{author}</h3>

                    <p className="text-xs text-gray-500">
                      {isCustomer ? "Customer" : "Staff"}
                    </p>
                  </div>

                  {messageDate && (
                    <time className="text-xs text-gray-500">
                      {formatDate(messageDate)}
                    </time>
                  )}
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                  {messageText || "Message content unavailable."}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Staff Reply */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Staff Reply</h2>

          <p className="mt-1 text-sm text-gray-500">
            Replies are saved to the ticket JSON file by the API.
          </p>
        </div>

        <form onSubmit={handleReply} className="space-y-5 p-5">
          {actionError && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {actionError}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              {notice}
            </p>
          )}

          <div>
            <label
              htmlFor="reply"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Your Message
            </label>

            <textarea
              id="reply"
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              rows={6}
              maxLength={3000}
              disabled={ticket.status === "Closed" || savingReply}
              placeholder={
                ticket.status === "Closed"
                  ? "Reopen the ticket before replying."
                  : "Write your reply here..."
              }
              className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {reply.length}/3000 characters
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={closeAfterReply}
              onChange={(event) => setCloseAfterReply(event.target.checked)}
              disabled={ticket.status === "Closed" || savingReply}
              className="h-4 w-4 rounded border-gray-300"
            />
            Close ticket after reply
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={
                ticket.status === "Closed" || savingReply || !reply.trim()
              }
              className="rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingReply ? "Posting Reply..." : "Post Reply"}
            </button>

            <button
              type="button"
              onClick={() => {
                setReply("");
                setActionError("");
              }}
              disabled={savingReply}
              className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => void handleStatusToggle()}
              disabled={updatingStatus || savingReply}
              className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingStatus
                ? "Updating..."
                : ticket.status === "Closed"
                  ? "Reopen Ticket"
                  : "Close Ticket"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-800">
        {value}
      </p>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
