import { notFound } from "next/navigation";
import {
  getAllTutorials,
  getTutorialBySlug,
  getAdjacentTutorials,
} from "@/lib/tutorials";
import InteractiveTutorial from "@/components/InteractiveTutorial";
import { allSteps } from "@/lib/tutorial-steps";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getAllTutorials().map((t) => ({ slug: t.slug }));
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://golang-tutorials.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) return { title: "Not Found" };

  const url = `${BASE_URL}/tutorials/${slug}`;
  const ogTitle = `${tutorial.title} — Go Tutorial`;

  return {
    title: tutorial.title,
    description: tutorial.description,
    keywords: [
      "Go",
      "Golang",
      tutorial.title,
      "Go tutorial",
      "learn Go",
      "Go programming",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: ogTitle,
      description: tutorial.description,
      url,
      siteName: "Learn Go",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: tutorial.description,
    },
  };
}

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) notFound();

  const { prev, next } = getAdjacentTutorials(slug);
  const steps = allSteps[slug] ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: tutorial.title,
    description: tutorial.description,
    url: `${BASE_URL}/tutorials/${slug}`,
    author: { "@type": "Organization", name: "Learn Go" },
    publisher: { "@type": "Organization", name: "Learn Go", url: BASE_URL },
    inLanguage: "en",
    isPartOf: {
      "@type": "Course",
      name: "Learn Go — Free Golang Tutorials",
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InteractiveTutorial
        tutorialTitle={tutorial.title}
        tutorialSlug={slug}
        steps={steps}
        prev={prev ? { slug: prev.slug, title: prev.title } : null}
        next={next ? { slug: next.slug, title: next.title } : null}
        currentOrder={tutorial.order}
        totalTutorials={getAllTutorials().length}
      />
    </>
  );
}
