import Link from "next/link";
import { getAllTutorials } from "@/lib/tutorials";
import TutorialGrid from "@/components/TutorialGrid";

export default function Home() {
  const tutorials = getAllTutorials();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Hero */}
      <div className="mb-16">
        <div className="mb-4 text-6xl">🐹</div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Learn Go from Scratch
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          A free, beginner-friendly tutorial series covering the Go programming
          language. From your first &ldquo;Hello, World!&rdquo; to goroutines
          and channels &mdash; learn by doing with real code examples.
        </p>
        {tutorials.length > 0 && (
          <Link
            href={`/tutorials/${tutorials[0].slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
          >
            Start Learning &rarr;
          </Link>
        )}
      </div>

      {/* Tutorial grid */}
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        All Tutorials
      </h2>
      <TutorialGrid tutorials={tutorials} />
    </div>
  );
}
