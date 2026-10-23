"use client";

import { useTranslations } from "next-intl";
import { Badge, Link } from "../../../../shadcnui";
import type { PublicBlogCategory } from "../../types/blog-public.types";
import { blogListHref } from "./blogPublicHelpers";

/**
 * Category filter: "All" plus one link per category. Every link keeps the
 * search query and drops the page, so a new filter starts from page one.
 * `chips` is the horizontal pill row; `list` is the vertical rail list.
 */
export function BlogCategoryChips(props: {
  categories: PublicBlogCategory[];
  basePath: string;
  activeCategorySlug?: string;
  query?: string;
  variant?: "chips" | "list";
  className?: string;
}) {
  const { categories, basePath, activeCategorySlug, query, variant = "chips", className } = props;
  const t = useTranslations();

  const items = [
    {
      key: "all",
      label: t("blog.public.all"),
      href: blogListHref(basePath, { q: query }),
      active: !activeCategorySlug,
    },
    ...categories.map((category) => ({
      key: category.id,
      label: category.name,
      href: blogListHref(basePath, { category: category.slug, q: query }),
      active: category.slug === activeCategorySlug,
    })),
  ];

  // Pills are Badges rendered as links: the active one is the filled default
  // variant, the rest are outline (chips row) or ghost (rail list).
  const inactiveVariant = variant === "chips" ? "outline" : "ghost";

  return (
    <nav aria-label={t("blog.entities.categories")} className={className}>
      <ul className={variant === "chips" ? "flex flex-wrap items-center gap-2" : "flex flex-col items-start gap-2"}>
        {items.map((item) => (
          <li key={item.key}>
            <Badge
              variant={item.active ? "default" : inactiveVariant}
              render={<Link href={item.href} aria-current={item.active ? "page" : undefined} />}
            >
              {item.label}
            </Badge>
          </li>
        ))}
      </ul>
    </nav>
  );
}
