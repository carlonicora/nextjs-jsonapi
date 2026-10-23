import { BlogCategoryInterface } from "../data/BlogCategoryInterface";
import { BlogPostInterface } from "../data/BlogPostInterface";
import { PublicBlogCategory, PublicBlogPost } from "../types/blog-public.types";

// Serialisation boundary: a rehydrated model (class instance, Date getters)
// becomes plain data a server page can pass to the public client components.

export function toPublicBlogPost(post: BlogPostInterface): PublicBlogPost {
  const publishedAt = post.publishedAt ?? post.createdAt;

  return {
    id: post.id,
    language: post.language ?? post.originalLanguage,
    title: post.title ?? "",
    slug: post.slug ?? "",
    summary: post.summary,
    body: post.body,
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    readingMinutes: post.readingMinutes ?? 1,
    publishedAt: publishedAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    authorName: post.authorName,
    categoryIds: [...post.categoryIds],
  };
}

export function toPublicBlogCategory(category: BlogCategoryInterface): PublicBlogCategory {
  return {
    id: category.id,
    name: category.name ?? "",
    slug: category.slug ?? "",
    description: category.description,
    image: category.image,
  };
}
