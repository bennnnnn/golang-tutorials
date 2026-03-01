import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import AuthButtons from "@/components/AuthButtons";
import AuthProvider from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import ThemeToggle from "@/components/ThemeToggle";
import CookieConsent from "@/components/CookieConsent";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { Analytics } from "@vercel/analytics/next";
import { getAllTutorials } from "@/lib/tutorials";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://golang-tutorials.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Learn Go — Free Golang Tutorials",
    template: "%s | Learn Go",
  },
  description:
    "Free, beginner-friendly Go tutorials with interactive code examples. Learn Go programming from scratch — variables, functions, goroutines, and more.",
  keywords: ["Go", "Golang", "Go tutorial", "learn Go", "Go programming", "Go language", "beginner Go"],
  authors: [{ name: "Go Tutorials" }],
  creator: "Go Tutorials",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    siteName: "Learn Go",
    title: "Learn Go — Free Golang Tutorials",
    description:
      "Free, beginner-friendly Go tutorials with interactive code examples. Learn Go programming from scratch.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn Go — Free Golang Tutorials",
    description:
      "Free, beginner-friendly Go tutorials with interactive code examples. Learn Go programming from scratch.",
  },
  alternates: {
    canonical: BASE_URL,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Go Tutorials",
    statusBarStyle: "default",
  },
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
        {/* Skip to content — keyboard / screen-reader navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-cyan-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none"
        >
          Skip to content
        </a>
        <AuthProvider>
          <ToastProvider>
          <div className="flex h-screen flex-col overflow-hidden">
            {/* Top header bar */}
            <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="hidden md:block" />
              <div className="md:hidden font-bold text-zinc-900 dark:text-zinc-100">
                🐹 Go Tutorials
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200" />
                <AuthButtons />
              </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar tutorials={tutorials} />
              <div className="flex flex-1 flex-col overflow-hidden">
                <MobileNav tutorials={tutorials} />
                <EmailVerificationBanner />
                <main id="main-content" className="flex-1 overflow-y-auto">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <footer className="border-t border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span>© {new Date().getFullYear()} Go Tutorials</span>
                  <Link href="/privacy" className="hover:text-cyan-600">Privacy</Link>
                  <Link href="/terms" className="hover:text-cyan-600">Terms</Link>
                  <Link href="/leaderboard" className="hover:text-cyan-600">Leaderboard</Link>
                  <a href="https://go.dev" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600">go.dev</a>
                </div>
              </footer>
              </div>
            </div>
          </div>
          <CookieConsent />
          </ToastProvider>
        </AuthProvider>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
          }}
        />
      </body>
    </html>
  );
}
