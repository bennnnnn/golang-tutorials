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
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
          <span className="text-xl">🐹</span>
          <span>Go Tutorials</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <Link
            href="/playground"
            onClick={() => setOpen(false)}
            className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
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
                      className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        isOnThisPage
                          ? "font-medium text-cyan-700 dark:text-cyan-400"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {isCompleted ? "✓" : i + 1}
                      </span>
                      {t.title}
                    </Link>
                    {t.subtopics.length > 0 && (
                      <button
                        onClick={() => toggleExpand(t.slug)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <svg
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
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
                    <ul className="ml-6 mt-1 space-y-0.5 border-l-2 border-zinc-200 pl-3 dark:border-zinc-800">
                      {t.subtopics.map((sub) => {
                        const isSubActive = isOnThisPage && activeHash === sub.id;
                        return (
                          <li key={sub.id}>
                            <Link
                              href={`${href}#${sub.id}`}
                              onClick={() => setOpen(false)}
                              className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                                isSubActive
                                  ? "bg-cyan-50 font-medium text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
                                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
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
