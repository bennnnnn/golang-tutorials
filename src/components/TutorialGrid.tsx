"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

interface Tutorial {
  slug: string;
  title: string;
  description: string;
}

export default function TutorialGrid({ tutorials }: { tutorials: Tutorial[] }) {
  const { user, progress } = useAuth();
  const completedCount = progress.length;
  const totalCount = tutorials.length;

  return (
    <>
      {user && totalCount > 0 && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Your Progress
            </span>
            <span className="text-zinc-500">
              {completedCount} / {totalCount} completed
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-cyan-600 transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {tutorials.map((tutorial, i) => {
          const isCompleted = progress.includes(tutorial.slug);
          return (
            <Link
              key={tutorial.slug}
              href={`/tutorials/${tutorial.slug}`}
              className="group relative rounded-xl border border-zinc-200 p-5 transition-all hover:border-cyan-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-cyan-800"
            >
              <div className="mb-2 flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isCompleted
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <h3 className="font-semibold text-zinc-900 group-hover:text-cyan-700 dark:text-zinc-100 dark:group-hover:text-cyan-400">
                  {tutorial.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {tutorial.description}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
