import { HELP_MODES, type HelpArticle, type HelpMode } from "../types/help-article.types";

export interface HelpNavGroup {
  mode: HelpMode;
  articles: HelpArticle[];
}

export function buildHelpNav(manifest: readonly HelpArticle[]): HelpNavGroup[] {
  return HELP_MODES.map((mode) => ({
    mode,
    articles: manifest.filter((a) => a.mode === mode && !a.draft).sort((a, b) => a.order - b.order),
  }));
}

export function findHelpArticle(manifest: readonly HelpArticle[], mode: string, slug: string): HelpArticle | undefined {
  return manifest.find((a) => a.mode === mode && a.slug === slug);
}

export function prevNextWithinMode(
  manifest: readonly HelpArticle[],
  current: HelpArticle,
): { prev: HelpArticle | null; next: HelpArticle | null } {
  const siblings = manifest.filter((a) => a.mode === current.mode && !a.draft).sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((a) => a.slug === current.slug);
  return {
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
  };
}
