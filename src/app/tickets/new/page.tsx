"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type TicketFormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  department: string;
  priority: string;
  orderNumber: string;
  message: string;
};

const initialForm: TicketFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  department: "Return",
  priority: "Medium",
  orderNumber: "",
  message: "",
};

export default function NewTicketPage() {
  const router = useRouter();

  const [form, setForm] = useState<TicketFormData>(initialForm);
  const [ticketNumber, setTicketNumber] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function updateField<K extends keyof TicketFormData>(
    field: K,
    value: TicketFormData[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }
  
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim(),
          department: form.department,
          priority: form.priority,
          orderNumber: form.orderNumber.trim(),
          message: form.message.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create ticket.");
      }

   
      setTicketNumber(String(result.data.id));
    } catch (error) {
      console.error("Create ticket error:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setFileName("");
    setTicketNumber("");
    setSubmitError("");
  }

  if (ticketNumber) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          ✓
        </div>

        <div className="mt-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Ticket Confirmation
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Ticket Created Successfully
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your ticket has been created successfully. Our support team will review your request.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Ticket Number</p>

            <p className="mt-2 text-2xl font-bold text-blue-700">
              {ticketNumber}
            </p>

            <p className="mt-3 break-words text-sm text-slate-600">
              Subject: {form.subject}
            </p>

            <p className="mt-1 break-words text-sm text-slate-600">
              Customer: {form.name}
            </p>
          </div>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Back to Tickets
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Create Another Ticket
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-700">
          Support Center
        </Link>

        <span>/</span>

        <Link href="/" className="hover:text-blue-700">
          Tickets
        </Link>

        <span>/</span>

        <span className="font-medium text-slate-800">Create Ticket</span>
      </div>

      {/* Heading */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          CUSTOMER SUPPORT
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Create New Ticket
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Describe your issue and provide your details so the support team can
          review your request.
        </p>
      </div>

      {/* API error message */}
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        onReset={(event) => {
          event.preventDefault();
          resetForm();
        }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Customer Information */}
        <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700">
              01
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Customer Information</h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the contact details for this ticket.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Customer Name" required>
              <input
                required
                autoComplete="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Enter customer name"
                className={inputClass}
              />
            </FormField>

            <FormField label="Email Address" required>
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="customer@example.com"
                className={inputClass}
              />
            </FormField>

            <FormField label="Phone Number">
              <input
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="Enter phone number (optional)"
                className={inputClass}
              />
            </FormField>

            <FormField label="Order Number">
              <input
                value={form.orderNumber}
                onChange={(event) =>
                  updateField("orderNumber", event.target.value)
                }
                placeholder="e.g. ORD-125368"
                className={inputClass}
              />
            </FormField>
          </div>
        </div>

        {/* Ticket Information */}
        <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700">
              02
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Ticket Information</h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a department and specify the issue.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Subject" required>
              <input
                required
                maxLength={150}
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                placeholder="Briefly describe your issue"
                className={inputClass}
              />
            </FormField>

            <FormField label="Department" required>
              <select
                required
                value={form.department}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
                className={inputClass}
              >
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
                <option value="Return">Return</option>
                <option value="Billing">Billing</option>
              </select>
            </FormField>

            <FormField label="Priority" required>
              <select
                required
                value={form.priority}
                onChange={(event) =>
                  updateField("priority", event.target.value)
                }
                className={inputClass}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Emergency">Emergency</option>
              </select>

              <p className="mt-1.5 text-xs text-slate-500">
                Select Emergency only for urgent issues.
              </p>
            </FormField>
          </div>
        </div>

        {/* Message */}
        <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700">
              03
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Describe Your Issue</h2>

              <p className="mt-1 text-sm text-slate-500">
                Include enough detail to help the support team understand the
                request.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <FormField label="Message" required>
              <textarea
                required
                minLength={10}
                rows={6}
                maxLength={3000}
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Explain the issue, what happened, and what assistance you need..."
                className={`${inputClass} resize-y`}
              />

              <p className="mt-1.5 text-right text-xs text-slate-400">
                {form.message.length}/3000 characters
              </p>
            </FormField>

            <FormField label="Attachment (Optional)">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                onChange={(event) =>
                  setFileName(event.target.files?.[0]?.name ?? "")
                }
                className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />

              <p className="mt-2 text-xs text-slate-500">
                Accepted formats: JPG, PNG, PDF, DOC and DOCX.
              </p>

              {fileName && (
                <p className="mt-2 break-all text-sm text-blue-700">
                  Selected: {fileName}
                </p>
              )}
            </FormField>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Cancel
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="reset"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating Ticket..." : "Create Ticket →"}
            </button>
          </div>
        </div>
      </form>

      <p className="text-center text-xs leading-5 text-slate-500">
        Your ticket information will be submitted to our support system.
      </p>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}
