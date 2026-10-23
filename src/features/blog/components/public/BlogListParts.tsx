"use client";

import { useTranslations } from "next-intl";
import { ContentTitle } from "../../../../components/navigations/ContentTitle";
import { buttonVariants, Link } from "../../../../shadcnui";
import { cn } from "../../../../utils/cn";
import type { PublicBlogCategory, PublicBlogList } from "../../types/blog-public.types";
import type { BlogListLayout } from "../../types/blog.constants";
import { blogListHref } from "./blogPublicHelpers";

export type BlogListProps = {
  layout: BlogListLayout;
  list: PublicBlogList;
  categories: PublicBlogCategory[];
  activeCategorySlug?: string;
  query?: string;
  page: number;
  basePath: string;
};

/** Eyebrow, page title and (optionally) the subtitle. */
export function BlogListHeader(props: { align?: "start" | "center"; showSubtitle?: boolean }) {
  const { align = "start", showSubtitle = true } = props;
  const t = useTranslations();
  return (
    <header className={align === "center" ? "text-center" : undefined}>
      <ContentTitle
        type={t("blog.public.eyebrow")}
        element={t("blog.public.title")}
        headingLevel={1}
        className={cn("mb-0", align === "center" && "[&_div]:justify-center")}
      />
      {showSubtitle ? (
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{t("blog.public.subtitle")}</p>
      ) : null}
    </header>
  );
}

/** Shown in place of the posts: "no results" when searching, "no posts yet" otherwise. */
export function BlogListEmpty(props: { query?: string; className?: string }) {
  const t = useTranslations();
  return (
    <p className={cn("text-muted-foreground py-12 text-center text-sm", props.className)}>
      {props.query ? t("blog.public.noResults") : t("blog.public.empty")}
    </p>
  );
}

/** "Load more": a plain link to the next page, keeping category and query. */
export function BlogLoadMore(props: {
  basePath: string;
  page: number;
  activeCategorySlug?: string;
  query?: string;
  className?: string;
}) {
  const { basePath, page, activeCategorySlug, query, className } = props;
  const t = useTranslations();
  return (
    <div className={cn("flex justify-center", className)}>
      {/* A styled Link, not <Button render={<Link />} nativeButton={false}>: Base UI then
          stamps role="button" on the anchor, so a control that navigates would announce
          as a button (same reasoning as HelpHeader). */}
      <Link
        href={blogListHref(basePath, { category: activeCategorySlug, q: query, page: page + 1 })}
        scroll={false}
        className={buttonVariants({ variant: "outline" })}
      >
        {t("blog.public.loadMore")}
      </Link>
    </div>
  );
}
