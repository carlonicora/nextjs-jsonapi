"use client";

import { useTranslations } from "next-intl";
import { MicroLabel } from "../../../../components/typography";
import { BlogCategoryChips } from "./BlogCategoryChips";
import { BlogListEmpty, BlogListHeader, type BlogListProps, BlogLoadMore } from "./BlogListParts";
import { BlogPostCard } from "./BlogPostCard";
import { BlogSearchBox } from "./BlogSearchBox";

/** Layout C: search and categories in a side rail; newest post large, the rest in two columns. */
export function BlogListRail(props: BlogListProps) {
  const { list, categories, activeCategorySlug, query, page, basePath } = props;
  const t = useTranslations();
  const [first, ...rest] = list.posts;

  return (
    <section className="px-4 pt-16 pb-20 md:pt-20">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[13rem_1fr] md:gap-12">
        <aside className="flex flex-col gap-6">
          <BlogListHeader showSubtitle={false} />
          <BlogSearchBox basePath={basePath} query={query} activeCategorySlug={activeCategorySlug} />
          <div>
            <MicroLabel as="span" className="block">
              {t("blog.entities.categories")}
            </MicroLabel>
            <BlogCategoryChips
              categories={categories}
              basePath={basePath}
              activeCategorySlug={activeCategorySlug}
              query={query}
              variant="list"
              className="mt-3"
            />
          </div>
        </aside>
        <div className="min-w-0">
          {first ? (
            <BlogPostCard post={first} categories={categories} basePath={basePath} variant="large" priority />
          ) : (
            <BlogListEmpty query={query} />
          )}
          {rest.length > 0 ? (
            <div className="border-border mt-10 grid gap-x-6 gap-y-10 border-t pt-10 sm:grid-cols-2">
              {rest.map((post) => (
                <BlogPostCard key={post.id} post={post} categories={categories} basePath={basePath} />
              ))}
            </div>
          ) : null}
          {list.hasMore ? (
            <BlogLoadMore
              basePath={basePath}
              page={page}
              activeCategorySlug={activeCategorySlug}
              query={query}
              className="mt-12"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
