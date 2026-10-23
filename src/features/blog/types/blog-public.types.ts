// Plain, serialisable view models handed from server pages to the public
// components. No class instances and no Date objects: they cross the
// server → client boundary as props.

import type { PartialBlock } from "@blocknote/core";

export type PublicBlogCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
};

export type PublicBlogPost = {
  id: string;
  language: string;
  title: string;
  slug: string;
  summary?: string;
  body?: PartialBlock[];
  coverImage?: string;
  coverImageAlt?: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  authorName?: string;
  categoryIds: string[];
};

export type PublicBlogList = {
  posts: PublicBlogPost[];
  hasMore: boolean;
};
