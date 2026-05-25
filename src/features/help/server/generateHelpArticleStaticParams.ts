import { getHelpContent } from "./getHelpContent";

export function generateHelpArticleStaticParams(): { mode: string; slug: string }[] {
  return getHelpContent()
    .manifest.filter((a) => !a.draft)
    .map((a) => ({ mode: a.mode, slug: a.slug }));
}
