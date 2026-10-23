"use client";

import { useTranslations } from "next-intl";
import { BlockNoteEditorContainer, DetailField, MicroLabel } from "../../../../components";
import { Badge } from "../../../../shadcnui";
import { BlogPostTranslationInterface } from "../../data";
import { useBlogLanguageName } from "./BlogTranslationStatus";

type BlogPostComparisonProps = {
  original: BlogPostTranslationInterface;
  translation: BlogPostTranslationInterface;
};

/** One language's text fields, read-only. Shared by both sides of the comparison. */
export function BlogPostTranslationFields({ translation }: { translation: BlogPostTranslationInterface }) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-y-4">
      <DetailField label={t("blog.fields.title")} value={translation.title} />
      <DetailField label={t("blog.fields.slug")} value={translation.slug} />
      <DetailField label={t("blog.fields.summary")} value={translation.summary} />
      <DetailField label={t("blog.fields.coverImageAlt")} value={translation.coverImageAlt} />
      <DetailField label={t("blog.fields.body")}>
        <BlockNoteEditorContainer id={translation.id} type="blog-post" initialContent={translation.body} />
      </DetailField>
    </div>
  );
}

/** Original on the inline start, translation on the inline end, same fields (mockup A → B's split view). */
export function BlogPostComparison({ original, translation }: BlogPostComparisonProps) {
  const t = useTranslations();
  const languageName = useBlogLanguageName();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="bg-muted/40 flex flex-col gap-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-x-2">
          <MicroLabel as="h3">{languageName(original.language)}</MicroLabel>
          <Badge variant="softGray">{t("blog.translation.original")}</Badge>
        </div>
        <BlogPostTranslationFields translation={original} />
      </div>
      <div className="flex flex-col gap-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-x-2">
          <MicroLabel as="h3">{languageName(translation.language)}</MicroLabel>
          {translation.source === "manual" && <Badge variant="softAmber">{t("blog.translation.editedByHand")}</Badge>}
        </div>
        <BlogPostTranslationFields translation={translation} />
      </div>
    </div>
  );
}
