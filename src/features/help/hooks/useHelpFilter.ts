"use client";
import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { HelpArticle } from "../types/help-article.types";

export function useHelpFilter(articles: readonly HelpArticle[]) {
  const [query, setQuery] = useState("");
  const fuse = useMemo(
    () =>
      new Fuse([...articles], {
        keys: [
          { name: "title", weight: 0.5 },
          { name: "summary", weight: 0.3 },
          { name: "tags", weight: 0.1 },
          { name: "headings.text", weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [articles],
  );
  const filtered = useMemo(() => {
    if (!query.trim()) return [...articles];
    return fuse.search(query).map((r) => r.item);
  }, [query, articles, fuse]);
  return { query, setQuery, filtered };
}
