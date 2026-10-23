"use client";

import { useTranslations } from "next-intl";
import { CommonDeleter } from "../../../../components";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { useBlogPost } from "../../contexts/BlogPostContext";
import { BlogPostService } from "../../data";

/**
 * Deletes the post and returns to the blog admin page.
 * Mirrors features/how-to/components/forms/HowToDeleter.tsx. The dialog texts
 * are passed explicitly: CommonDeleter's default reads `entities.<type>`, a
 * namespace only the app may fill, so the blog's own entity name is used.
 */
export function BlogPostDeleter() {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { post } = useBlogPost();

  if (!post) return null;

  const type = t("blog.entities.post");

  return (
    <CommonDeleter
      title={t("common.delete.title", { type })}
      subtitle={t("common.delete.subtitle", { type })}
      description={<div className="text-destructive p-4 text-sm">{t("common.delete.description", { type })}</div>}
      showLabel
      deleteFunction={() => BlogPostService.delete({ id: post.id })}
      redirectTo={generateUrl({ page: Modules.BlogPost })}
    />
  );
}
