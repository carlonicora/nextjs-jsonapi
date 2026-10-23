"use client";

import { useFormatter, useTranslations } from "next-intl";
import { cn } from "../../../../utils/cn";
import type { PublicBlogPost } from "../../types/blog-public.types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "author · date · updated · reading time". Each part is opt-in so cards show
 * only the reading time while the hero and the post page show more.
 */
export function BlogPostMeta(props: {
  post: PublicBlogPost;
  showAuthor?: boolean;
  showDate?: boolean;
  showUpdated?: boolean;
  className?: string;
}) {
  const { post, showAuthor, showDate, showUpdated, className } = props;
  const t = useTranslations();
  const format = useFormatter();

  const parts: string[] = [];
  if (showAuthor && post.authorName) parts.push(t("blog.public.by", { author: post.authorName }));
  if (showDate && post.publishedAt) {
    parts.push(format.dateTime(new Date(post.publishedAt), { dateStyle: "medium" }));
  }
  if (
    showUpdated &&
    post.publishedAt &&
    post.updatedAt &&
    new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > ONE_DAY_MS
  ) {
    parts.push(t("blog.public.updated", { date: format.dateTime(new Date(post.updatedAt), { dateStyle: "medium" }) }));
  }
  parts.push(t("blog.public.readingTime", { minutes: post.readingMinutes }));

  return (
    <p className={cn("text-muted-foreground text-xs", className)}>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? " · " : null}
          {part}
        </span>
      ))}
    </p>
  );
}
