// Server-safe public barrel for the blog feature.
// Consumed via `@carlonicora/nextjs-jsonapi/blog/server`. Must NOT receive a
// "use client" directive: server pages import the cached public fetchers and
// the plain view-model types from here without pulling the client bundle.
// Client components live in `@carlonicora/nextjs-jsonapi/blog`.

export {
  fetchBlogSettings,
  fetchPublicBlogCategories,
  fetchPublicBlogPost,
  fetchPublicBlogPosts,
  fetchRelatedBlogPosts,
} from "./server/fetchers";
export { toPublicBlogCategory, toPublicBlogPost } from "./server/toPublic";
export { BLOG_LIST_LAYOUTS } from "./types/blog.constants";
export type { BlogListLayout } from "./types/blog.constants";
export type { PublicBlogCategory, PublicBlogList, PublicBlogPost } from "./types/blog-public.types";
