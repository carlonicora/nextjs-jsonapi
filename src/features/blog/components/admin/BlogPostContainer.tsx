"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RoundPageContainer } from "../../../../components";
import { SharedProvider } from "../../../../contexts/SharedContext";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { BreadcrumbItemData } from "../../../../interfaces";
import { Badge } from "../../../../shadcnui";
import { BlogPostProvider, useBlogPost } from "../../contexts/BlogPostContext";
import { BlogPostDeleter } from "./BlogPostDeleter";
import { BlogPostPublishButton } from "./BlogPostPublishButton";
import { BlogPostTranslationPanel } from "./BlogPostTranslationPanel";
import { BLOG_STATUS_BADGE, useBlogLanguageName } from "./BlogTranslationStatus";

export type BlogPostContainerProps = {
  postId: string;
};

/**
 * Admin post page: one tab per language, the original first and marked
 * "Original" (approved mockup A). Mirrors
 * features/email-automation/components/containers/EmailAutomationContainer.tsx.
 */
export function BlogPostContainer({ postId }: BlogPostContainerProps) {
  return (
    <BlogPostProvider postId={postId}>
      <BlogPostShell />
    </BlogPostProvider>
  );
}

function BlogPostShell() {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const languageName = useBlogLanguageName();
  const { post, reload } = useBlogPost();

  const translations = useMemo(() => {
    const all = post?.translations ?? [];
    return [
      ...all.filter((translation) => translation.isOriginal),
      ...all.filter((translation) => !translation.isOriginal),
    ];
  }, [post]);

  if (!post) return null;

  const title = post.original?.title ?? post.title ?? "";

  const breadcrumbs: BreadcrumbItemData[] = [
    { name: t("blog.admin.title"), href: generateUrl({ page: Modules.BlogPost }) },
    { name: title },
  ];

  const statusLabel = {
    draft: t("blog.status.draft"),
    published: t("blog.status.published"),
    unpublished: t("blog.status.unpublished"),
  }[post.status];

  const tabLabel = (translation: (typeof translations)[number]) => {
    const parts = [languageName(translation.language)];
    if (translation.isOriginal) parts.push(t("blog.translation.original"));
    if (translation.aiStatus === "pending" || translation.aiStatus === "in_progress")
      parts.push(t("blog.translation.translating"));
    if (translation.aiStatus === "failed") parts.push(t("blog.translation.failed"));
    return parts.join(" · ");
  };

  return (
    <SharedProvider
      value={{
        breadcrumbs,
        title: {
          type: t("blog.admin.title"),
          element: title,
          functions: [
            <Badge key="blogPostStatus" variant={BLOG_STATUS_BADGE[post.status]}>
              {statusLabel}
            </Badge>,
            <BlogPostPublishButton key="blogPostPublish" />,
            <BlogPostDeleter key="blogPostDeleter" />,
          ],
        },
      }}
    >
      <RoundPageContainer
        module={Modules.BlogPost}
        id={post.id}
        fullWidth
        forceHeader
        tabs={translations.map((translation) => ({
          sectionKey: translation.language,
          label: tabLabel(translation),
          content: <BlogPostTranslationPanel post={post} translation={translation} onChanged={reload} />,
        }))}
      />
    </SharedProvider>
  );
}
