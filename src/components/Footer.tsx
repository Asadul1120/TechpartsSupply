import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-center text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between md:text-left lg:px-8">
        <p>© 2026 TechpartsSupply. All rights reserved.</p>

        <div className="flex flex-wrap justify-center gap-4 md:justify-end">
          <Link href="#" className="hover:text-blue-700">
            Privacy Policy
          </Link>

          <Link href="#" className="hover:text-blue-700">
            Terms & Conditions
          </Link>

          <Link href="#" className="hover:text-blue-700">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
