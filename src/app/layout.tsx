import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import AuthButtons from "@/components/AuthButtons";
import AuthProvider from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getAllTutorials } from "@/lib/tutorials";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learn Go - Golang Tutorials",
  description:
    "A comprehensive, beginner-friendly guide to the Go programming language with interactive code examples.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tutorials = getAllTutorials();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="flex h-screen flex-col overflow-hidden">
            {/* Top header bar */}
            <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="hidden md:block" />
              <div className="md:hidden font-bold text-zinc-900 dark:text-zinc-100">
                🐹 Go Tutorials
              </div>
              <AuthButtons />
            </header>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar tutorials={tutorials} />
              <div className="flex flex-1 flex-col overflow-hidden">
                <MobileNav tutorials={tutorials} />
                <main className="flex-1 overflow-y-auto"><ErrorBoundary>{children}</ErrorBoundary></main>
              </div>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
