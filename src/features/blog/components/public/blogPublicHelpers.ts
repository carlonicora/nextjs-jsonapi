import type { PublicBlogCategory, PublicBlogPost } from "../../types/blog-public.types";

/**
 * Locale-free href to the public list, keeping the active filters.
 * Parameter order is fixed (category, q, page) so links are stable.
 */
export function blogListHref(basePath: string, params: { category?: string; q?: string; page?: number }): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function blogPostHref(basePath: string, slug: string): string {
  return `${basePath}/${encodeURIComponent(slug)}`;
}

/** The first of the post's categories that the visitor's category list knows. */
export function resolvePostCategory(
  post: PublicBlogPost,
  categories: PublicBlogCategory[],
): PublicBlogCategory | undefined {
  for (const id of post.categoryIds) {
    const category = categories.find((c) => c.id === id);
    if (category) return category;
  }
  return undefined;
}
