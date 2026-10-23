// Mirrors packages/nestjs-neo4jsonapi/src/foundations/blog/blog.constants.ts and
// CoreModuleId.Blog. The two packages share no code, so the values are repeated.

export const BLOG_LIST_LAYOUTS = ["featured", "column", "rail"] as const;
export type BlogListLayout = (typeof BLOG_LIST_LAYOUTS)[number];

export const BLOG_POST_STATUSES = ["draft", "published", "unpublished"] as const;
export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number];

export const BLOG_TRANSLATION_SOURCES = ["original", "ai", "manual"] as const;
export type BlogTranslationSource = (typeof BLOG_TRANSLATION_SOURCES)[number];

// Same values as the backend AiStatus enum.
export type BlogAiStatus = "pending" | "in_progress" | "completed" | "failed";

export const BLOG_SETTINGS_ID = "5f3c2a9e-8d41-4b7a-9c2e-1a6b0d4e7f13";

export const BLOG_MODULE_ID = "c1d0e6a2-4b8f-4f3e-9a7d-2e5b8c6f1a90";

/**
 * Storage root for blog images (covers, category images, images pasted into a
 * post body). Blog content belongs to the platform, not to a company, and the
 * administrators who write it may belong to no company, so the keys are
 * `blog/<folder>/<id>/<file>` instead of `companies/<companyId>/...`. An app's
 * S3 key access policy must allow Administrators on this root.
 */
export const BLOG_UPLOAD_ROOT = "blog";
export const BLOG_POST_UPLOAD_PREFIX = `${BLOG_UPLOAD_ROOT}/blog-posts`;
export const BLOG_CATEGORY_UPLOAD_PREFIX = `${BLOG_UPLOAD_ROOT}/blog-categories`;

/** Path prefix of the token-free public blog endpoints (`public/blog-posts`, ...). */
export const BLOG_PUBLIC_PREFIX = "public";

/** Action segments under a blog resource (`blog-posts/:id/publish`, ...). */
export const BLOG_ACTION = {
  publish: "publish",
  unpublish: "unpublish",
  retranslate: "retranslate",
  related: "related",
} as const;
