"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components";
import { Button } from "../../../../shadcnui";
import { useBlogPost } from "../../contexts/BlogPostContext";
import { BlogPostService } from "../../data";

/**
 * Publish / Unpublish in the post page header. Publishing an unpublished post
 * republishes it (the first publish date is kept server-side).
 * Mirrors features/email-automation/components/canvas/EmailAutomationActiveSwitch.tsx.
 */
export function BlogPostPublishButton() {
  const t = useTranslations();
  const { post, reload } = useBlogPost();
  const [saving, setSaving] = useState<boolean>(false);

  if (!post) return null;

  const isPublished = post.status === "published";

  const toggle = async () => {
    setSaving(true);
    try {
      if (isPublished) await BlogPostService.unpublish({ id: post.id });
      else await BlogPostService.publish({ id: post.id });
      await reload();
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isPublished ? "outline" : "default"}
      onClick={() => void toggle()}
      disabled={saving}
    >
      {isPublished ? <EyeOffIcon /> : <EyeIcon />}
      {isPublished ? t("blog.actions.unpublish") : t("blog.actions.publish")}
    </Button>
  );
}
