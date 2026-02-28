import type { MetadataRoute } from "next";
import { getAllTutorials } from "@/lib/tutorials";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://golang-tutorials.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const tutorials = getAllTutorials();

  const tutorialEntries = tutorials.map((tutorial) => ({
    url: `${BASE_URL}/tutorials/${tutorial.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...tutorialEntries,
  ];
}
