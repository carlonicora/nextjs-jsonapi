// Server-only barrel for BlockNote rendering.
// Consumed via `@carlonicora/nextjs-jsonapi/blocknote/server`. Must NOT receive a
// "use client" directive: it loads @blocknote/server-util (and its JSDOM), which
// must never reach a client bundle. The app lists @blocknote/server-util in
// `serverExternalPackages` so Node loads it instead of the bundler.

export { BlockNoteServerContent } from "./server/BlockNoteServerContent";
