/**
 * Help-article types for the frontend help feature. Self-contained — the
 * published frontend library stays decoupled from `@carlonicora/nestjs-neo4jsonapi`.
 */

export const HELP_MODES = ["tutorial", "how-to", "reference", "explanation"] as const;
export type HelpMode = (typeof HELP_MODES)[number];

export interface HelpHeading {
  depth: 2 | 3;
  slug: string;
  text: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  mode: HelpMode;
  title: string;
  summary: string;
  order: number;
  tags: readonly string[];
  contextualKeys: readonly string[];
  aiIndexed: boolean;
  draft: boolean;
  path: string;
  headings: readonly HelpHeading[];
  relatedSlugs: readonly string[];
  lastUpdated: string;
}

export interface HelpRedirect {
  from: string;
  to: string;
}
