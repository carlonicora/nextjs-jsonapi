"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { BlockNoteEditorContainer } from "../../../../components/editors/BlockNoteEditorContainer";
import { ContentTitle } from "../../../../components/navigations/ContentTitle";
import { SectionHeader } from "../../../../components/typography";
import { Link } from "../../../../shadcnui";
import type { PublicBlogCategory, PublicBlogPost } from "../../types/blog-public.types";
import { resolvePostCategory } from "./blogPublicHelpers";
import { BlogPostCard, BlogPostCover } from "./BlogPostCard";
import { BlogPostMeta } from "./BlogPostMeta";

/**
 * Public post page: back link, category, title, summary, meta, cover, body,
 * then up to three posts from the same category.
 */
export function BlogPostView(props: {
  post: PublicBlogPost;
  categories: PublicBlogCategory[];
  related: PublicBlogPost[];
  basePath: string;
}) {
  const { post, categories, related, basePath } = props;
  const t = useTranslations();
  const category = resolvePostCategory(post, categories);
  const more = related.slice(0, 3);

  return (
    <article className="px-4 pt-12 pb-20 md:pt-16">
      <div className="mx-auto max-w-3xl">
        <Link href={basePath} className="inline-flex items-center gap-1.5">
          <ArrowLeftIcon className="size-4 rtl:rotate-180" />
          {t("blog.public.back")}
        </Link>
        <header className="mt-8">
          <ContentTitle type={category?.name} element={post.title} headingLevel={1} className="mb-0" />
          {post.summary ? <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{post.summary}</p> : null}
          <BlogPostMeta post={post} showAuthor showDate showUpdated className="mt-4" />
        </header>
        {post.coverImage ? (
          <BlogPostCover
            src={post.coverImage}
            alt={post.coverImageAlt}
            sizes="(min-width: 768px) 768px, 100vw"
            priority
            className="mt-8 aspect-[16/9]"
          />
        ) : null}
        <div className="mt-8">
          <BlockNoteEditorContainer id={post.id} type="blog-post" initialContent={post.body} />
        </div>
      </div>
      {more.length > 0 ? (
        <section className="mx-auto mt-16 max-w-5xl">
          <div className="border-border border-t pt-10">
            <SectionHeader level={2}>{t("blog.public.moreIn", { category: category?.name ?? "" })}</SectionHeader>
            <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((relatedPost) => (
                <BlogPostCard
                  key={relatedPost.id}
                  post={relatedPost}
                  categories={categories}
                  basePath={basePath}
                  headingLevel="h3"
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
