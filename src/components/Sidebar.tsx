"use client";

import Link from "next/link";
import { useNavState } from "@/hooks/useNavState";
import { useAuth } from "@/components/AuthProvider";

interface SubTopic {
  id: string;
  title: string;
}

interface SidebarItem {
  slug: string;
  title: string;
  order: number;
  subtopics: SubTopic[];
}

export default function Sidebar({ tutorials }: { tutorials: SidebarItem[] }) {
  const { pathname, expanded, activeHash, toggleExpand } = useNavState(tutorials);
  const { progress } = useAuth();

  return (
    <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          <span className="text-2xl">🐹</span>
          <span>Go Tutorials</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        <Link
          href="/playground"
          className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/playground"
              ? "bg-cyan-50 font-medium text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs dark:bg-zinc-800">⚡</span>
          Playground
        </Link>
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Lessons
        </p>
        <ul className="space-y-1">
          {tutorials.map((tutorial, i) => {
            const href = `/tutorials/${tutorial.slug}`;
            const isOnThisPage = pathname === href;
            const isExpanded = expanded === tutorial.slug;
            const isCompleted = progress.includes(tutorial.slug);

            return (
              <li key={tutorial.slug}>
                {/* Topic row */}
                <div className="flex items-center">
                  <Link
                    href={href}
                    className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isOnThisPage
                        ? "font-medium text-cyan-700 dark:text-cyan-400"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : isOnThisPage
                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {isCompleted ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="flex-1">{tutorial.title}</span>
                  </Link>
                  {tutorial.subtopics.length > 0 && (
                    <button
                      onClick={() => toggleExpand(tutorial.slug)}
                      className="mr-1 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
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

                {/* Sub-topics */}
                {isExpanded && tutorial.subtopics.length > 0 && (
                  <ul className="ml-8 mt-1 space-y-0.5 border-l-2 border-zinc-200 pl-3 dark:border-zinc-800">
                    {tutorial.subtopics.map((sub) => {
                      const isSubActive = isOnThisPage && activeHash === sub.id;
                      return (
                        <li key={sub.id}>
                          <Link
                            href={`${href}#${sub.id}`}
                            className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                              isSubActive
                                ? "bg-cyan-50 font-medium text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
                                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
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
    </aside>
  );
}
