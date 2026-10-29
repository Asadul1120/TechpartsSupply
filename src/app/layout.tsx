import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "TechpartsSupply Support",
  description: "Customer Support Ticket Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <Header />
        <Navigation />

        <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
