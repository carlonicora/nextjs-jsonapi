"use client";

import { BlogCategoryChips } from "./BlogCategoryChips";
import { BlogListEmpty, BlogListHeader, type BlogListProps, BlogLoadMore } from "./BlogListParts";
import { BlogPostCard } from "./BlogPostCard";
import { BlogSearchBox } from "./BlogSearchBox";

/** Layout A: newest post as a hero, then filters, then a three-column grid. */
export function BlogListFeatured(props: BlogListProps) {
  const { list, categories, activeCategorySlug, query, page, basePath } = props;
  const [hero, ...rest] = list.posts;

  return (
    <section className="px-4 pt-16 pb-20 md:pt-20">
      <div className="mx-auto max-w-5xl">
        <BlogListHeader />
        {hero ? (
          <div className="mt-10">
            <BlogPostCard post={hero} categories={categories} basePath={basePath} variant="hero" priority />
          </div>
        ) : null}
        <div className="mt-12 flex flex-col gap-3 md:flex-row md:items-center">
          <BlogCategoryChips
            categories={categories}
            basePath={basePath}
            activeCategorySlug={activeCategorySlug}
            query={query}
            className="flex-1"
          />
          <BlogSearchBox
            basePath={basePath}
            query={query}
            activeCategorySlug={activeCategorySlug}
            className="md:w-64"
          />
        </div>
        {list.posts.length === 0 ? <BlogListEmpty query={query} /> : null}
        {rest.length > 0 ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
