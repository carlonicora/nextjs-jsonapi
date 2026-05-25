// Server-only public barrel for the help feature.
// Consumed via `@carlonicora/nextjs-jsonapi/help/server`. Must NOT receive a
// "use client" directive.
//
// This barrel exposes only server-safe utilities (no React components). The
// React Server Component / Client Component boundary is enforced by tsup-level
// bundle splitting: server containers cannot directly import client components
// without leaking client-only modules (react-dom/client, hook usage at module
// init) into server scopes. Consumers therefore compose the page shells in
// their own route files, importing client primitives from
// `@carlonicora/nextjs-jsonapi/help` and server utilities from here.

export { getHelpContent } from "./server/getHelpContent";
export { serializeHelpArticle } from "./server/serializeHelpArticle";
export { generateHelpArticleStaticParams, generateHelpArticleMetadata, generateHelpModeStaticParams } from "./server";
export { findHelpArticle, prevNextWithinMode, buildHelpNav } from "./utils/helpNavigation";
export { setHelpReader } from "../../core/registry/helpStore";
export type { HelpContentConfig, HelpBrandConfig } from "./interfaces/help-content-config.interface";
export { HELP_MODES } from "./types/help-article.types";
export type { HelpArticle, HelpHeading, HelpMode, HelpRedirect } from "./types/help-article.types";
