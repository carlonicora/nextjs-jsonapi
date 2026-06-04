// Client-only public barrel for the help feature.
// Consumed via `@carlonicora/nextjs-jsonapi/help`. Tsup adds a top-level
// "use client" directive to the bundled output via clientEntries.
//
// Pair this with `@carlonicora/nextjs-jsonapi/help/server` for the server-safe
// HELP_MODES constant + article types (imported by server-component pages).
// Consumers compose page shells themselves: import the client primitives below
// (HelpProvider, HelpHeader, HelpSideNav, HelpArticleBody, HelpTOC, etc.) and
// assemble pages in app routes.

export { HelpProvider, useHelp } from "./contexts/HelpContext";
export { HelpHeader } from "./components/HelpHeader";
export { HelpSideNav } from "./components/HelpSideNav";
export { HelpArticleBody } from "./components/HelpArticleBody";
export { HelpTOC } from "./components/HelpTOC";
export { HelpHint } from "./components/HelpHint";
export { HelpAskAi } from "./components/HelpAskAi";
export { HelpSearchResultRow } from "./components/HelpSearchResultRow";
export { useHelpFilter } from "./hooks/useHelpFilter";
export { articleUrl, modeUrl } from "./utils/articleUrl";
export { HELP_I18N_KEYS } from "./i18n-keys";
export type { HelpContentConfig, HelpBrandConfig } from "./interfaces/help-content-config.interface";
export { HELP_MODES } from "./types/help-article.types";
export type { HelpArticle, HelpHeading, HelpMode, HelpRedirect } from "./types/help-article.types";
