"use client";

import { BlogCategoryChips } from "./BlogCategoryChips";
import { BlogListEmpty, BlogListHeader, type BlogListProps, BlogLoadMore } from "./BlogListParts";
import { BlogPostCard } from "./BlogPostCard";
import { BlogSearchBox } from "./BlogSearchBox";

/** Layout B: one narrow reading column, every post a row (image at the start, text at the end). */
export function BlogListColumn(props: BlogListProps) {
  const { list, categories, activeCategorySlug, query, page, basePath } = props;

  return (
    <section className="px-4 pt-16 pb-20 md:pt-20">
      <div className="mx-auto max-w-2xl">
        <BlogListHeader align="center" />
        <BlogCategoryChips
          categories={categories}
          basePath={basePath}
          activeCategorySlug={activeCategorySlug}
          query={query}
          className="mt-8 [&>ul]:justify-center"
        />
        <BlogSearchBox basePath={basePath} query={query} activeCategorySlug={activeCategorySlug} className="mt-4" />
        {list.posts.length === 0 ? (
          <BlogListEmpty query={query} />
        ) : (
          <div className="divide-border mt-10 flex flex-col divide-y">
            {list.posts.map((post, index) => (
              <div key={post.id} className="py-6 first:pt-0">
                <BlogPostCard
                  post={post}
                  categories={categories}
                  basePath={basePath}
                  variant="row"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        )}
        {list.hasMore ? (
          <BlogLoadMore
            basePath={basePath}
            page={page}
            activeCategorySlug={activeCategorySlug}
            query={query}
            className="mt-10"
          />
        ) : null}
      </div>
    </section>
  );
}
