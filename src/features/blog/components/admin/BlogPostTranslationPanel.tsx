"use client";

import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { DetailField } from "../../../../components";
import { Alert, AlertDescription, Badge, Button } from "../../../../shadcnui";
import { isRemoteImageSrc } from "../../../../utils";
import { BlogPostInterface, BlogPostTranslationInterface, BlogPostTranslationService } from "../../data";
import { BlogPostComparison, BlogPostTranslationFields } from "./BlogPostComparison";
import { BlogPostEditor } from "./BlogPostEditor";
import { BlogPostTranslationEditor } from "./BlogPostTranslationEditor";
import { useBlogCategoryNames } from "../../hooks/useBlogCategoryNames";
import { BlogTranslationStatus, useBlogDateFormatter, useBlogLanguageName } from "./BlogTranslationStatus";

type BlogPostTranslationPanelProps = {
  post: BlogPostInterface;
  translation: BlogPostTranslationInterface;
  /** Re-reads the post after an edit or a re-translation request. */
  onChanged?: () => Promise<void>;
};

/**
 * One language tab of the admin post page (approved mockup A).
 * - Original tab: cover image, categories, status, the text fields and an Edit
 *   that opens BlogPostEditor (which re-translates every other language).
 * - Translation tab: where the text came from, whether it was edited by hand,
 *   the overwrite warning, "Compare with original", the job status, the text
 *   fields and an Edit that opens BlogPostTranslationEditor.
 */
export function BlogPostTranslationPanel({ post, translation, onChanged }: BlogPostTranslationPanelProps) {
  const t = useTranslations();
  const categoryName = useBlogCategoryNames();
  const languageName = useBlogLanguageName();
  const formatDate = useBlogDateFormatter();
  const [isComparing, setIsComparing] = useState<boolean>(false);

  const original = post.original;
  const reload = onChanged ?? (async () => {});

  const editTrigger = (
    <Button render={<div />} nativeButton={false} size="sm" variant="outline">
      <PencilIcon />
      {t("blog.actions.edit")}
    </Button>
  );

  if (translation.isOriginal) {
    const statusLabel = {
      draft: t("blog.status.draft"),
      published: t("blog.status.published"),
      unpublished: t("blog.status.unpublished"),
    }[post.status];

    return (
      <div className="flex w-full flex-col gap-y-6 p-4">
        <div className="flex items-center justify-between gap-x-4">
          <Badge variant="softGray">{t("blog.translation.original")}</Badge>
          <BlogPostEditor post={post} trigger={editTrigger} onSuccess={reload} />
        </div>
        {post.coverImage && (
          <Image
            src={post.coverImage}
            alt={translation.coverImageAlt ?? translation.title}
            width={640}
            height={360}
            className="h-auto max-h-72 w-auto rounded-lg object-cover"
            unoptimized={isRemoteImageSrc(post.coverImage)}
          />
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DetailField label={t("blog.fields.status")} value={statusLabel} />
          <DetailField label={t("blog.fields.publishedAt")} value={formatDate(post.publishedAt) || "—"} />
          <DetailField
            label={t("blog.fields.categories")}
            value={
              post.categories
                .map((category) => categoryName(category.id))
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
        </div>
        <BlogPostTranslationFields translation={translation} />
      </div>
    );
  }

  const isWorking = translation.aiStatus === "pending" || translation.aiStatus === "in_progress";

  return (
    <div className="flex w-full flex-col gap-y-6 p-4">
      <Alert>
        <AlertDescription className="flex flex-col gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {translation.source === "manual" && <Badge variant="softAmber">{t("blog.translation.editedByHand")}</Badge>}
            {original && translation.translatedAt && (
              <span>
                {t("blog.translation.translatedFrom", {
                  language: languageName(original.language),
                  date: formatDate(translation.translatedAt),
                })}
              </span>
            )}
          </div>
          <span>{t("blog.translation.overwriteWarning")}</span>
          {original && (
            <div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsComparing((value) => !value)}>
                {isComparing ? t("blog.actions.hideComparison") : t("blog.actions.compareWithOriginal")}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between gap-x-4">
        <BlogTranslationStatus
          aiStatus={translation.aiStatus}
          onRetranslate={async () => {
            await BlogPostTranslationService.retranslate({ id: translation.id });
            await reload();
          }}
        />
        {!isWorking && <BlogPostTranslationEditor translation={translation} trigger={editTrigger} onSuccess={reload} />}
      </div>

      {isComparing && original ? (
        <BlogPostComparison original={original} translation={translation} />
      ) : (
        <BlogPostTranslationFields translation={translation} />
      )}
    </div>
  );
}
