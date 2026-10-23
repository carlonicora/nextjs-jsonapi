"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import {
  EditorSheet,
  EntityMultiSelector,
  FormBlockNote,
  FormInput,
  FormSelect,
  FormTextarea,
} from "../../../../components";
import { Modules } from "../../../../core";
import { getI18nSupportedLocales, useI18nLocale, useI18nRouter } from "../../../../i18n";
import {
  BlogCategoryInterface,
  BlogCategoryService,
  BlogPostInput,
  BlogPostInterface,
  BlogPostService,
} from "../../data";
import { BlogCoverImageField, BlogImageSelection, uploadBlogImage } from "./BlogCoverImageField";
import { blogCategoryAdminName, useBlogLanguageName } from "./BlogTranslationStatus";
import { BLOG_POST_UPLOAD_PREFIX } from "../../types/blog.constants";
import { useBlogCategoryNames } from "../../hooks/useBlogCategoryNames";

type BlogPostEditorProps = {
  /** Edit mode when present: the post's original translation and shared fields. */
  post?: BlogPostInterface;
  trigger?: ReactNode;
  onSuccess?: () => void | Promise<void>;
};

const isBodyEmpty = (body: any) => !body || (Array.isArray(body) && body.length === 0);

/**
 * Creates a post, or edits its original-language text plus the fields every
 * language shares (cover image, categories). Saving the original makes the
 * worker translate it again. Mirrors features/how-to/components/forms/HowToEditor.tsx.
 */
export function BlogPostEditor({ post, trigger, onSuccess }: BlogPostEditorProps) {
  const t = useTranslations();
  const categoryName = useBlogCategoryNames();
  const router = useI18nRouter();
  const locale = useI18nLocale();
  const languageName = useBlogLanguageName();
  const original = post?.original;
  const [cover, setCover] = useState<BlogImageSelection>(null);
  const [isBodyEmptyState, setIsBodyEmptyState] = useState<boolean>(isBodyEmpty(original?.body));

  const languages = useMemo(() => getI18nSupportedLocales(), []);

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.string().uuid(),
        originalLanguage: z.string().min(1, { message: t("blog.errors.language") }),
        title: z.string().min(1, { message: t("blog.errors.title") }),
        slug: z.string().optional(),
        summary: z.string().optional(),
        body: z.any(),
        coverImage: z.string().optional(),
        coverImageAlt: z.string().optional(),
        categories: z.array(z.object({ id: z.string(), name: z.string() })),
      }),
    [],
  );

  const getDefaultValues = useCallback(
    () => ({
      id: post?.id || v4(),
      originalLanguage: post?.originalLanguage ?? (languages.includes(locale) ? locale : languages[0]),
      title: original?.title ?? "",
      slug: original?.slug ?? "",
      summary: original?.summary ?? "",
      body: original?.body || [],
      // The stored value is a signed URL, not a key: only a newly picked file
      // writes a key here, and only then is the field sent.
      coverImage: "",
      coverImageAlt: original?.coverImageAlt ?? "",
      categories: (post?.categories ?? []).map((category) => ({
        id: category.id,
        name: blogCategoryAdminName(category),
      })),
    }),
    [post, original, languages, locale],
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
      entityName={original?.title}
      title={post ? t("blog.admin.editPost") : t("blog.admin.newPost")}
      isEdit={!!post}
      module={Modules.BlogPost}
      size="lg"
      isFormDirty={isFormDirty}
      onSubmit={async (values) => {
        if (values.coverImage && cover) await uploadBlogImage({ key: values.coverImage, selection: cover });

        const payload: BlogPostInput = {
          id: values.id,
          title: values.title,
          // An empty summary lets the worker write one; on edit the summary is
          // sent only when changed here, so an untouched AI summary is regenerated.
          summary: post
            ? form.getFieldState("summary").isDirty
              ? values.summary
              : undefined
            : values.summary || undefined,
          body: values.body,
          coverImage: values.coverImage && cover ? values.coverImage : undefined,
          coverImageAlt: values.coverImageAlt,
          categoryIds: values.categories.map((category) => category.id),
        };

        if (post) {
          return BlogPostService.update({
            ...payload,
            originalLanguage: post.originalLanguage,
            slug: values.slug || undefined,
          });
        }
        return BlogPostService.create({ ...payload, originalLanguage: values.originalLanguage });
      }}
      onReset={() => {
        setCover(null);
        setIsBodyEmptyState(isBodyEmpty(original?.body));
        return getDefaultValues();
      }}
      onSuccess={onSuccess}
      onNavigate={(url) => router.push(url)}
      trigger={trigger}
    >
      <div className="flex h-full min-h-0 w-full flex-col gap-y-4">
        {!post && (
          <FormSelect
            form={form}
            id="originalLanguage"
            name={t("blog.fields.originalLanguage")}
            values={languages.map((language) => ({ id: language, text: languageName(language) }))}
            isRequired
          />
        )}
        <FormInput form={form} id="title" name={t("blog.fields.title")} isRequired />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-y-4">
            {post && (
              <FormInput form={form} id="slug" name={t("blog.fields.slug")} description={t("blog.fields.slugHelp")} />
            )}
            <EntityMultiSelector<BlogCategoryInterface>
              id="categories"
              form={form}
              label={t("blog.fields.categories")}
              retriever={(params) => BlogCategoryService.findMany(params)}
              module={Modules.BlogCategory}
              getLabel={blogCategoryAdminName}
              // A post's included categories carry no translations, so the stored chip
              // names come from the category list.
              getFormValueLabel={(value: { id: string; name?: string }) => value.name || categoryName(value.id)}
            />
            <FormTextarea
              form={form}
              id="summary"
              name={t("blog.fields.summary")}
              description={t("blog.fields.summaryHelp")}
              className="min-h-24"
            />
          </div>
          <div className="flex flex-col gap-y-4">
            <BlogCoverImageField
              form={form}
              id="coverImage"
              label={t("blog.fields.coverImage")}
              keyPrefix={BLOG_POST_UPLOAD_PREFIX}
              entityId={form.getValues("id")}
              currentUrl={post?.coverImage}
              alt={original?.coverImageAlt}
              selection={cover}
              onSelectionChange={setCover}
            />
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
