// Client-only public barrel for the blog feature.
// Consumed via `@carlonicora/nextjs-jsonapi/blog`. Tsup adds a top-level
// "use client" directive to the bundled output via clientEntries.
//
// Models, services and modules are server-safe and ship from
// `@carlonicora/nextjs-jsonapi/core`. Server fetchers ship from
// `@carlonicora/nextjs-jsonapi/blog/server`.

export * from "./components/admin";
export * from "./components/public";
export * from "./contexts";
// Imported for its registerTableGenerator side effect as well as its exports.
export * from "./hooks";
export * from "./types/blog.constants";
export type { PublicBlogCategory, PublicBlogList, PublicBlogPost } from "./types/blog-public.types";
