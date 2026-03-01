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
    <aside className="hidden md:flex w-76 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
          <span className="text-3xl">🐹</span>
          <span>Go Tutorials</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        <Link
          href="/playground"
          className={`mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
            pathname === "/playground"
              ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
              : "text-zinc-800 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white"
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm dark:bg-zinc-700">⚡</span>
          Playground
        </Link>
        <p className="mb-3 px-2 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
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
                    className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors ${
                      isOnThisPage
                        ? "bg-cyan-50 font-semibold text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
                        : "font-medium text-zinc-800 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : isOnThisPage
                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-800 dark:text-cyan-300"
                        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                    }`}>
                      {isCompleted ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="flex-1 leading-snug">{tutorial.title}</span>
                  </Link>
                  {tutorial.subtopics.length > 0 && (
                    <button
                      onClick={() => toggleExpand(tutorial.slug)}
                      className="mr-1 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
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

                {/* Sub-topics */}
                {isExpanded && tutorial.subtopics.length > 0 && (
                  <ul className="ml-9 mt-1 space-y-0.5 border-l-2 border-zinc-300 pl-3 dark:border-zinc-600">
                    {tutorial.subtopics.map((sub) => {
                      const isSubActive = isOnThisPage && activeHash === sub.id;
                      return (
                        <li key={sub.id}>
                          <Link
                            href={`${href}#${sub.id}`}
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
    </aside>
  );
}
