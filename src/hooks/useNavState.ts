"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SubTopic {
  id: string;
  title: string;
}

interface NavItem {
  slug: string;
  title: string;
  subtopics: SubTopic[];
}

export function useNavState(tutorials: NavItem[]) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [activeHash, setActiveHash] = useState("");

  // Synchronously expand the active tutorial when pathname changes
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    const active = tutorials.find((t) => pathname === `/tutorials/${t.slug}`);
    if (active) setExpanded(active.slug);
  }

  // Track the URL hash for active subtopic highlighting
  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash.replace("#", ""));
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  // Also update hash when pathname changes (Next.js client navigation)
  useEffect(() => {
    setActiveHash(window.location.hash.replace("#", ""));
  }, [pathname]);

  // Track which subtopic is in view via IntersectionObserver
  useEffect(() => {
    const activeTutorial = tutorials.find((t) => pathname === `/tutorials/${t.slug}`);
    if (!activeTutorial || activeTutorial.subtopics.length === 0) return;

    const ids = activeTutorial.subtopics.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHash(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [pathname, tutorials]);

  const toggleExpand = (slug: string) => {
    setExpanded((prev) => (prev === slug ? null : slug));
  };

  return { pathname, expanded, activeHash, toggleExpand };
}
