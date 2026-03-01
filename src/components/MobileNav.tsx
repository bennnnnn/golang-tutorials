"use client";

import { useState } from "react";
import Link from "next/link";
import { useNavState } from "@/hooks/useNavState";
import { useAuth } from "@/components/AuthProvider";

interface SubTopic {
  id: string;
  title: string;
}

interface NavItem {
  slug: string;
  title: string;
  subtopics: SubTopic[];
}

export default function MobileNav({ tutorials }: { tutorials: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const { pathname, expanded, activeHash, toggleExpand } = useNavState(tutorials);
  const { progress } = useAuth();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
          <span className="text-2xl">🐹</span>
          <span>Go Tutorials</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <Link
            href="/playground"
            onClick={() => setOpen(false)}
            className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <span>⚡</span> Playground
          </Link>
          <ul className="space-y-1">
            {tutorials.map((t, i) => {
              const href = `/tutorials/${t.slug}`;
              const isOnThisPage = pathname === href;
              const isExpanded = expanded === t.slug;
              const isCompleted = progress.includes(t.slug);
              return (
                <li key={t.slug}>
                  <div className="flex items-center">
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium ${
                        isOnThisPage
                          ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
                          : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                      }`}>
                        {isCompleted ? "✓" : i + 1}
                      </span>
                      {t.title}
                    </Link>
                    {t.subtopics.length > 0 && (
                      <button
                        onClick={() => toggleExpand(t.slug)}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {isExpanded && t.subtopics.length > 0 && (
                    <ul className="ml-8 mt-1 space-y-0.5 border-l-2 border-zinc-300 pl-3 dark:border-zinc-600">
                      {t.subtopics.map((sub) => {
                        const isSubActive = isOnThisPage && activeHash === sub.id;
                        return (
                          <li key={sub.id}>
                            <Link
                              href={`${href}#${sub.id}`}
                              onClick={() => setOpen(false)}
                              className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                                isSubActive
                                  ? "bg-cyan-50 font-semibold text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
                                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                              }`}
                            >
                              {sub.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
