"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { EditorSheet, FormBlockNote, FormInput, FormTextarea } from "../../../../components";
import { Modules } from "../../../../core";
import { BlogPostTranslationInterface, BlogPostTranslationService } from "../../data";
import { useBlogLanguageName } from "./BlogTranslationStatus";
import { BLOG_POST_UPLOAD_PREFIX } from "../../types/blog.constants";

type BlogPostTranslationEditorProps = {
  translation: BlogPostTranslationInterface;
  trigger?: ReactNode;
  onSuccess?: () => void | Promise<void>;
};

const isBodyEmpty = (body: any) => !body || (Array.isArray(body) && body.length === 0);

const buildFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().uuid(),
    title: z.string().min(1, { message: t("blog.errors.title") }),
    slug: z.string().optional(),
    summary: z.string().optional(),
    body: z.any(),
    coverImageAlt: z.string().optional(),
  });

/**
 * Edits one non-original translation by hand. Saving marks it `manual` and
 * re-runs nothing. Mirrors features/how-to/components/forms/HowToEditor.tsx.
 */
export function BlogPostTranslationEditor({ translation, trigger, onSuccess }: BlogPostTranslationEditorProps) {
  const t = useTranslations();
  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const languageName = useBlogLanguageName();
  const [isBodyEmptyState, setIsBodyEmptyState] = useState<boolean>(isBodyEmpty(translation.body));

  const getDefaultValues = useCallback(
    () => ({
      id: translation.id,
      title: translation.title ?? "",
      slug: translation.slug ?? "",
      summary: translation.summary ?? "",
      body: translation.body || [],
      coverImageAlt: translation.coverImageAlt ?? "",
    }),
    [translation],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const { dirtyFields } = form.formState;
  const isFormDirty = useCallback(() => {
    const dirty: Record<string, unknown> = { ...dirtyFields };
    if (dirty.body && isBodyEmptyState) delete dirty.body;
    return Object.keys(dirty).length > 0;
  }, [dirtyFields, isBodyEmptyState]);

  return (
    <EditorSheet
      form={form}
      entityType={t("blog.entities.post")}
      entityName={translation.title}
      title={`${t("blog.admin.editPost")} · ${languageName(translation.language)}`}
      isEdit
      module={Modules.BlogPostTranslation}
      size="lg"
      isFormDirty={isFormDirty}
      onSubmit={async (values) =>
        BlogPostTranslationService.update({
          id: values.id,
          title: values.title,
          slug: values.slug || undefined,
          summary: values.summary,
          body: values.body,
          coverImageAlt: values.coverImageAlt,
        })
      }
      onReset={() => {
        setIsBodyEmptyState(isBodyEmpty(translation.body));
        return getDefaultValues();
      }}
      onSuccess={onSuccess ?? (() => {})}
      trigger={trigger}
    >
      <div className="flex h-full min-h-0 w-full flex-col gap-y-4">
        <FormInput form={form} id="title" name={t("blog.fields.title")} isRequired />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-y-4">
            <FormInput form={form} id="slug" name={t("blog.fields.slug")} description={t("blog.fields.slugHelp")} />
            <FormTextarea form={form} id="summary" name={t("blog.fields.summary")} className="min-h-24" />
          </div>
          <div className="flex flex-col gap-y-4">
            <FormInput form={form} id="coverImageAlt" name={t("blog.fields.coverImageAlt")} />
          </div>
        </div>
        <FormBlockNote
          uploadKeyPrefix={BLOG_POST_UPLOAD_PREFIX}
          form={form}
          id="body"
          name={t("blog.fields.body")}
          type="blog-post"
          isRequired
          stretch
          className="min-h-96"
          onEmptyChange={setIsBodyEmptyState}
        />
      </div>
    </EditorSheet>
  );
}
