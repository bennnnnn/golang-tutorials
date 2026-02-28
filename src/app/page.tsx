import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAllTutorials } from "@/lib/tutorials";
import TutorialGrid from "@/components/TutorialGrid";
import GoogleOAuthError from "@/components/GoogleOAuthError";

export const metadata: Metadata = {
  title: "Learn Go — Free Golang Tutorials",
  description:
    "Free, beginner-friendly Go tutorials with interactive code examples. Learn Go from scratch — variables, functions, goroutines, and more. 15 tutorials included.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Learn Go — Free Golang Tutorials",
    description:
      "Free, beginner-friendly Go tutorials with interactive code examples. Learn Go from scratch — variables, functions, goroutines, and more.",
    type: "website",
  },
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://golang-tutorials.vercel.app";

export default function Home() {
  const tutorials = getAllTutorials();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Learn Go — Free Golang Tutorials",
    description:
      "Free, beginner-friendly Go tutorials with interactive code examples. Learn Go from scratch — variables, functions, goroutines, and more.",
    url: BASE_URL,
    provider: { "@type": "Organization", name: "Learn Go", url: BASE_URL },
    hasCourseInstance: tutorials.map((t) => ({
      "@type": "CourseInstance",
      name: t.title,
      url: `${BASE_URL}/tutorials/${t.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <GoogleOAuthError />
      </Suspense>
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
