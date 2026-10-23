"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FormInput, FormSelect, FormTextarea, SectionHeader } from "../../../../components";
import { Modules } from "../../../../core";
import { getI18nSupportedLocales, useI18nLocale } from "../../../../i18n";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../shadcnui";
import {
  BlogCategoryInterface,
  BlogCategoryService,
  BlogCategoryTranslationInterface,
  BlogCategoryTranslationService,
} from "../../data";
import { BlogCoverImageField, BlogImageSelection, uploadBlogImage } from "./BlogCoverImageField";
import { BlogTranslationStatus, useBlogLanguageName } from "./BlogTranslationStatus";
import { BLOG_CATEGORY_UPLOAD_PREFIX } from "../../types/blog.constants";

type BlogCategoryEditorProps = {
  /** Edit mode when present. */
  category?: BlogCategoryInterface;
  trigger?: ReactNode;
  onSuccess?: () => void | Promise<void>;
};

const buildTranslationSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string(),
    name: z.string().min(1, { message: t("blog.errors.name") }),
    slug: z.string().optional(),
    description: z.string().optional(),
  });

const buildFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().uuid(),
    originalLanguage: z.string().min(1, { message: t("blog.errors.language") }),
    name: z.string().min(1, { message: t("blog.errors.name") }),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    translations: z.array(buildTranslationSchema(t)),
  });

type TranslationValues = z.infer<ReturnType<typeof buildTranslationSchema>>;

const sameTranslation = (a: TranslationValues, b?: TranslationValues) =>
  !!b && a.name === b.name && (a.slug ?? "") === (b.slug ?? "") && (a.description ?? "") === (b.description ?? "");

/**
 * Creates a category, or edits its original-language text and image plus, in
 * edit mode, each AI translation by hand (one collapsible section per language).
 * Submit updates the category when the original changed (which re-translates
 * every other language) and each translation that changed (marked `manual`).
 * Mirrors features/how-to/components/forms/HowToEditor.tsx.
 */
export function BlogCategoryEditor({ category, trigger, onSuccess }: BlogCategoryEditorProps) {
  const t = useTranslations();
  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const locale = useI18nLocale();
  const languageName = useBlogLanguageName();
  const [image, setImage] = useState<BlogImageSelection>(null);

  const languages = useMemo(() => getI18nSupportedLocales(), []);
  const original = category?.original;
  const translations: BlogCategoryTranslationInterface[] = useMemo(
    () => (category?.translations ?? []).filter((translation) => !translation.isOriginal),
    [category],
  );

  const getDefaultValues = useCallback(
    () => ({
      id: category?.id || v4(),
      originalLanguage: category?.originalLanguage ?? (languages.includes(locale) ? locale : languages[0]),
      name: original?.name ?? category?.name ?? "",
      slug: original?.slug ?? "",
      description: original?.description ?? "",
      // The stored value is a signed URL, not a key: only a newly picked file writes a key.
      image: "",
      translations: translations.map((translation) => ({
        id: translation.id,
        name: translation.name ?? "",
        slug: translation.slug ?? "",
        description: translation.description ?? "",
      })),
    }),
    [category, original, translations, languages, locale],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  return (
    <EditorSheet
      form={form}
      entityType={t("blog.entities.category")}
      entityName={original?.name ?? category?.name}
      title={category ? t("blog.admin.editCategory") : t("blog.admin.newCategory")}
      isEdit={!!category}
      module={Modules.BlogCategory}
      size="md"
      onSubmit={async (values) => {
        if (values.image && image) await uploadBlogImage({ key: values.image, selection: image });
        const imageKey = values.image && image ? values.image : undefined;

        if (!category) {
          return BlogCategoryService.create({
            id: values.id,
            originalLanguage: values.originalLanguage,
            name: values.name,
            description: values.description,
            image: imageKey,
          });
        }

        const defaults = getDefaultValues();
        const originalChanged =
          !!imageKey ||
          !sameTranslation(
            { id: values.id, name: values.name, slug: values.slug, description: values.description },
            { id: defaults.id, name: defaults.name, slug: defaults.slug, description: defaults.description },
          );

        if (originalChanged) {
          await BlogCategoryService.update({
            id: values.id,
            originalLanguage: category?.originalLanguage,
            name: values.name,
            slug: values.slug || undefined,
            description: values.description,
            image: imageKey,
          });
        }

        for (const translation of values.translations) {
          const before = defaults.translations.find((candidate) => candidate.id === translation.id);
          if (sameTranslation(translation, before)) continue;
          await BlogCategoryTranslationService.update({
            id: translation.id,
            name: translation.name,
            slug: translation.slug || undefined,
            description: translation.description,
          });
        }

        return { id: values.id };
      }}
      onReset={() => {
        setImage(null);
        return getDefaultValues();
      }}
      onSuccess={onSuccess ?? (() => {})}
      trigger={trigger}
    >
      <div className="flex w-full flex-col gap-y-4">
        {!category && (
          <FormSelect
            form={form}
            id="originalLanguage"
            name={t("blog.fields.originalLanguage")}
            values={languages.map((language) => ({ id: language, text: languageName(language) }))}
            isRequired
          />
        )}
        <FormInput form={form} id="name" name={t("blog.fields.name")} isRequired />
        {category && (
          <FormInput form={form} id="slug" name={t("blog.fields.slug")} description={t("blog.fields.slugHelp")} />
        )}
        <FormTextarea form={form} id="description" name={t("blog.fields.description")} />
        <BlogCoverImageField
          form={form}
          id="image"
          label={t("blog.fields.image")}
          keyPrefix={BLOG_CATEGORY_UPLOAD_PREFIX}
          entityId={form.getValues("id")}
          currentUrl={category?.image}
          selection={image}
          onSelectionChange={setImage}
        />

        {translations.length > 0 && (
          <div className="flex flex-col gap-y-2">
            <SectionHeader className="mt-2">{t("blog.fields.languages")}</SectionHeader>
            {translations.map((translation, index) => (
              <Collapsible key={translation.id} className="rounded-md border">
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-x-2 px-3 py-2 text-start">
                  <span className="flex items-center gap-x-2 text-sm font-medium">
                    {languageName(translation.language)}
                    <BlogTranslationStatus aiStatus={translation.aiStatus} />
                  </span>
                  <ChevronDownIcon className="text-muted-foreground size-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-y-4 border-t p-3">
                  {translation.aiStatus === "failed" && (
                    <BlogTranslationStatus
                      aiStatus={translation.aiStatus}
                      onRetranslate={async () => {
                        await BlogCategoryTranslationService.retranslate({ id: translation.id });
                        await onSuccess?.();
                      }}
                    />
                  )}
                  <FormInput form={form} id={`translations.${index}.name`} name={t("blog.fields.name")} isRequired />
                  <FormInput
                    form={form}
                    id={`translations.${index}.slug`}
                    name={t("blog.fields.slug")}
                    description={t("blog.fields.slugHelp")}
                  />
                  <FormTextarea
                    form={form}
                    id={`translations.${index}.description`}
                    name={t("blog.fields.description")}
                  />
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </EditorSheet>
  );
}
