"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Modules } from "../../../core";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../hooks";
import { useI18nLocale } from "../../../i18n";
import { Badge, Link } from "../../../shadcnui";
import { BLOG_STATUS_BADGE } from "../components/admin/BlogTranslationStatus";
import { useBlogCategoryNames } from "./useBlogCategoryNames";
import { BlogPostFields, BlogPostInterface } from "../data";

/**
 * Admin posts table: title (original language, links to the post page),
 * status, categories, published date and "languages ready" (completed
 * translations / all translations). Mirrors hooks/useEmailAutomationTableStructure.tsx
 * in features/email-automation.
 */
export const useBlogPostTableStructure: UseTableStructureHook<BlogPostInterface, BlogPostFields> = (params) => {
  const t = useTranslations();
  const locale = useI18nLocale();
  const generateUrl = usePageUrlGenerator();
  const categoryName = useBlogCategoryNames();

  const tableData = useMemo(() => {
    return params.data.map((post: BlogPostInterface) => {
      const entry: TableContent<BlogPostInterface> = { jsonApiData: post };
      params.fields.forEach((field) => {
        entry[field] = (post as any)[field as keyof BlogPostInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<BlogPostFields, () => any>> = {
    [BlogPostFields.title]: () => ({
      id: BlogPostFields.title,
      accessorKey: BlogPostFields.title,
      header: t("blog.fields.title"),
      cell: ({ row }: { row: TableContent<BlogPostInterface> }) => {
        const post: BlogPostInterface = row.original.jsonApiData;
        return (
          <Link href={generateUrl({ page: Modules.BlogPost, id: post.id })}>
            {post.original?.title ?? post.title ?? post.id}
          </Link>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [BlogPostFields.status]: () => ({
      id: BlogPostFields.status,
      accessorKey: BlogPostFields.status,
      header: t("blog.fields.status"),
      cell: ({ row }: { row: TableContent<BlogPostInterface> }) => {
        const post: BlogPostInterface = row.original.jsonApiData;
        const label = {
          draft: t("blog.status.draft"),
          published: t("blog.status.published"),
          unpublished: t("blog.status.unpublished"),
        }[post.status];
        return <Badge variant={BLOG_STATUS_BADGE[post.status] ?? "softGray"}>{label ?? post.status}</Badge>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [BlogPostFields.categories]: () => ({
      id: BlogPostFields.categories,
      accessorKey: BlogPostFields.categories,
      header: t("blog.fields.categories"),
      cell: ({ row }: { row: TableContent<BlogPostInterface> }) => {
        const post: BlogPostInterface = row.original.jsonApiData;
        const names = post.categories.map((category) => categoryName(category.id)).filter(Boolean);
        if (names.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
        return <span className="text-xs">{names.join(", ")}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [BlogPostFields.publishedAt]: () => ({
      id: BlogPostFields.publishedAt,
      accessorKey: BlogPostFields.publishedAt,
      header: t("blog.fields.publishedAt"),
      cell: ({ row }: { row: TableContent<BlogPostInterface> }) => {
        const post: BlogPostInterface = row.original.jsonApiData;
        if (!post.publishedAt) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <span className="text-xs tabular-nums">
            {post.publishedAt.toLocaleDateString(locale, { dateStyle: "medium" })}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [BlogPostFields.languages]: () => ({
      id: BlogPostFields.languages,
      accessorKey: BlogPostFields.languages,
      header: t("blog.fields.languages"),
      cell: ({ row }: { row: TableContent<BlogPostInterface> }) => {
        const post: BlogPostInterface = row.original.jsonApiData;
        const total = post.translations.length;
        if (total === 0) return <span className="text-muted-foreground text-xs">—</span>;
        const ready = post.translations.filter((translation) => translation.aiStatus === "completed").length;
        return (
          <span className="block text-xs tabular-nums text-end">
            {ready}/{total}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<BlogPostInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl, locale, categoryName]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("blog-posts", useBlogPostTableStructure);
