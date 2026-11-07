"use client";

import { useTranslations } from "next-intl";
import { useDateFormatter } from "../../../../contexts/DateLocaleContext";
import { cn } from "../../../../utils/cn";
import type { PublicBlogPost } from "../../types/blog-public.types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "author · date · updated · reading time". Each part except reading time is
 * opt-in. The public blog shows no dates, so its callers pass only showAuthor.
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
  const dates = useDateFormatter();

  const parts: string[] = [];
  if (showAuthor && post.authorName) parts.push(t("blog.public.by", { author: post.authorName }));
  if (showDate && post.publishedAt) {
    parts.push(dates.format(post.publishedAt, "dateMedium"));
  }
  if (
    showUpdated &&
    post.publishedAt &&
    post.updatedAt &&
    new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > ONE_DAY_MS
  ) {
    parts.push(t("blog.public.updated", { date: dates.format(post.updatedAt, "dateMedium") }));
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
