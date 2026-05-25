import type { Metadata } from "next";
import { findHelpArticle } from "../utils/helpNavigation";
import { getHelpContent } from "./getHelpContent";

export async function generateHelpArticleMetadata({
  params,
}: {
  params: Promise<{ mode: string; slug: string }>;
}): Promise<Metadata> {
  const { mode, slug } = await params;
  const article = findHelpArticle(getHelpContent().manifest, mode, slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    openGraph: { title: article.title, description: article.summary },
  };
}
