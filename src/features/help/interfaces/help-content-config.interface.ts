import type { HelpArticle, HelpRedirect } from "../types/help-article.types";

export interface HelpBrandConfig {
  /** URL of the brand logo image (served by the consuming app). */
  logo?: string;
  /** Brand label shown in the help header. */
  label?: string;
  /** Where the "Open app" button navigates for logged-in users. Defaults to "/". */
  appHref?: string;
}

export interface HelpContentConfig {
  manifest: readonly HelpArticle[];
  namespaceUuid: string;
  redirects?: readonly HelpRedirect[];
  brand?: HelpBrandConfig;
  /** Invoked when the user clicks "Ask AI about this" on an article. */
  onAskAi?: (howToId: string) => void;
}
