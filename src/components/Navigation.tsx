import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-5">
          <details className="group relative">
            <summary className="cursor-pointer list-none rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
              ☰ Category
            </summary>

            <div className="absolute left-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <Link
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100"
              >
                Single Product
              </Link>

              <Link
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100"
              >
                Category Pages
              </Link>

              <Link
                href="#"
                className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100"
              >
                Admin Pages
              </Link>

              <Link
                href="/"
                className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100"
              >
                Support Ticket
              </Link>
            </div>
          </details>

          <Link
            href="/"
            className="text-sm font-semibold text-slate-700 hover:text-blue-700"
          >
            Home
          </Link>

          <Link href="/" className="text-sm font-semibold text-blue-700">
            Ticket System
          </Link>
        </div>

        <Link
          href="/tickets/new"
          className="rounded-lg border border-blue-700 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          + Create New Ticket
        </Link>
      </div>
    </nav>
  );
}
