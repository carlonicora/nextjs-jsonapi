// Client-only barrel for the date-locale hooks, consumed via
// `@carlonicora/nextjs-jsonapi/date-locale`. Tsup adds a top-level "use client"
// directive to the bundled output via clientEntries.
//
// The same exports are on `@carlonicora/nextjs-jsonapi/contexts`. This entry
// exists for modules an app loads on the server outside any component tree:
// the app's `useDateFnsLocale`, handed to `configureI18n` from `config/env.ts`,
// which every page imports. Importing `contexts` there pulls the contexts bundle,
// whose shared chunk holds the `next/dynamic` BlockNote import, into that server
// graph, and Turbopack dev then fails every page with "Parent client reference
// not found for next/dynamic import". This entry reaches only the light chunks.
export * from "../contexts/DateLocaleContext";
