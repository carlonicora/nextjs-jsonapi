// Server-safe public barrel for the help feature.
// Consumed via `@carlonicora/nextjs-jsonapi/help/server`. Must NOT receive a
// "use client" directive — server components (e.g. the /help index + mode pages)
// import HELP_MODES/HelpMode from here without pulling the client bundle.
//
// Now that help articles are served from the API (HowTo) rather than the MDX
// manifest, this barrel exposes only the shared mode constant + article types.
// Client primitives live in `@carlonicora/nextjs-jsonapi/help`.

export { HELP_MODES } from "./types/help-article.types";
export type { HelpArticle, HelpHeading, HelpMode, HelpRedirect } from "./types/help-article.types";
