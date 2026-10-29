"use client";

import Link from "next/link";
import { type FormEvent } from "react";

export default function Header() {
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = formData.get("search");

    if (typeof query === "string" && query.trim()) {
      console.log("Search:", query.trim());
    }
  }

  return (
    <header className="bg-white">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="rounded bg-emerald-500/15 px-2 py-1 font-semibold text-emerald-400">
              SSL SECURE
            </span>
            <span>Secure Customer Support</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="#" className="hover:text-blue-300">
              ABOUT US
            </Link>

            <Link href="#" className="hover:text-blue-300">
              TERMS & CONDITIONS
            </Link>

            <Link href="#" className="hover:text-blue-300">
              CONTACT US
            </Link>

            <Link href="#" className="hover:text-blue-300">
              WISH LIST
            </Link>

            <Link href="#" className="hover:text-blue-300">
              CART
            </Link>

            <Link href="#" className="hover:text-blue-300">
              LOGIN
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link href="/" className="shrink-0">
            <div className="text-2xl font-extrabold tracking-tight">
              <span className="text-blue-700">Techparts</span>
              <span className="text-slate-800">Supply</span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Professional Customer Support
            </p>
          </Link>

          <form onSubmit={handleSearch} className="flex w-full md:max-w-md">
            <input
              type="search"
              name="search"
              placeholder="Search products or support..."
              aria-label="Search products or support"
              className="min-w-0 flex-1 rounded-l-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="submit"
              className="rounded-r-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Search
            </button>
          </form>

          <div className="shrink-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Need assistance?
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              (347) 470 6982
            </p>

            <p className="mt-1 text-xs text-slate-500">Mon-Fri 9am-6pm EST</p>
          </div>
        </div>
      </div>
    </header>
  );
}
