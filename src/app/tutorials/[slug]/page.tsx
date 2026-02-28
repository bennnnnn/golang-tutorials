import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { codeToHtml } from "shiki";
import {
  getAllTutorials,
  getTutorialBySlug,
  getAdjacentTutorials,
} from "@/lib/tutorials";
import CodePlayground from "@/components/CodePlayground";
import TutorialNav from "@/components/TutorialNav";
import SignupWall from "@/components/SignupWall";
import type { Metadata } from "next";

// Generate static params for all tutorials
export function generateStaticParams() {
  return getAllTutorials().map((t) => ({ slug: t.slug }));
}

// Dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) return { title: "Not Found" };

  return {
    title: `${tutorial.title} | Learn Go`,
    description: tutorial.description,
  };
}

// Custom code block component with Shiki syntax highlighting
async function CodeBlock({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const lang = className?.replace("language-", "") ?? "text";
  const html = await codeToHtml(children.trim(), {
    lang,
    theme: "one-dark-pro",
  });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// Helper to slugify heading text for anchor IDs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// MDX components
const mdxComponents = {
  h2: (props: { children: string }) => {
    const id = slugify(String(props.children).replace(/`/g, ""));
    return (
      <h2 id={id} className="scroll-mt-20">
        {props.children}
      </h2>
    );
  },
  h3: (props: { children: string }) => {
    const id = slugify(String(props.children).replace(/`/g, ""));
    return (
      <h3 id={id} className="scroll-mt-20">
        {props.children}
      </h3>
    );
  },
  pre: ({ children }: { children: React.ReactElement }) => {
    return children;
  },
  code: (props: { children: string; className?: string }) => {
    // Inline code (no className)
    if (!props.className) {
      return (
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {props.children}
        </code>
      );
    }
    // Interactive playground for ```gorun blocks
    if (props.className === "language-gorun") {
      const raw = String(props.children).trim();
      // Extract title from first line if it's a comment like: // hello.go
      const lines = raw.split("\n");
      let title: string | undefined;
      let code = raw;
      if (lines[0]?.startsWith("// ") && lines[0].endsWith(".go")) {
        title = lines[0].replace("// ", "");
        code = lines.slice(1).join("\n").trim();
      }
      return <CodePlayground code={code} title={title} />;
    }
    // Regular code block with syntax highlighting
    return <CodeBlock {...props} />;
  },
};

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) notFound();

  const { prev, next } = getAdjacentTutorials(slug);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-zinc-400">
        <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-600 dark:text-zinc-300">
          {tutorial.title}
        </span>
      </nav>

      {/* Title */}
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {tutorial.title}
      </h1>
      <p className="mb-10 text-lg text-zinc-500 dark:text-zinc-400">
        {tutorial.description}
      </p>

      {/* MDX Content */}
      <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:tracking-tight prose-code:before:content-none prose-code:after:content-none prose-pre:p-0 prose-pre:bg-transparent">
        <MDXRemote source={tutorial.content} components={mdxComponents} />
      </article>

      {/* Navigation — auto-marks complete on Next click */}
      <TutorialNav
        slug={slug}
        prev={prev ? { slug: prev.slug, title: prev.title } : null}
        next={next ? { slug: next.slug, title: next.title } : null}
      />

      {/* Signup wall — appears after 5 free pages */}
      <SignupWall slug={slug} />
    </div>
  );
}
