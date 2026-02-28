import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export interface SubTopic {
  id: string;
  title: string;
}

export interface TutorialMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
  subtopics: SubTopic[];
}

export interface Tutorial extends TutorialMeta {
  content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractSubtopics(content: string): SubTopic[] {
  const headingRegex = /^## (.+)$/gm;
  const subtopics: SubTopic[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const title = match[1].replace(/`/g, "").trim();
    subtopics.push({ id: slugify(title), title });
  }
  return subtopics;
}

export function getAllTutorials(): TutorialMeta[] {
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));

  const tutorials = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const filePath = path.join(contentDir, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      order: data.order ?? 999,
      subtopics: extractSubtopics(content),
    };
  });

  return tutorials.sort((a, b) => a.order - b.order);
}

export function getTutorialBySlug(slug: string): Tutorial | null {
  const filePath = path.join(contentDir, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    order: data.order ?? 999,
    subtopics: extractSubtopics(content),
    content,
  };
}

export function getAdjacentTutorials(currentSlug: string) {
  const all = getAllTutorials();
  const idx = all.findIndex((t) => t.slug === currentSlug);

  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}
