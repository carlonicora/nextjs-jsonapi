"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { registerTableGenerator, TableContent, UseTableStructureHook } from "../../../hooks";
import { BlogCategoryEditor } from "../components/admin/BlogCategoryEditor";
import { blogCategoryAdminName } from "../components/admin/BlogTranslationStatus";
import { BlogCategoryFields, BlogCategoryInterface } from "../data";

/**
 * Admin categories table: the name (original language) opens BlogCategoryEditor
 * for that row; "languages ready" counts completed translations. Categories have
 * no page of their own. Mirrors hooks/useEmailAutomationTableStructure.tsx in
 * features/email-automation.
 */
export const useBlogCategoryTableStructure: UseTableStructureHook<BlogCategoryInterface, BlogCategoryFields> = (
  params,
) => {
  const t = useTranslations();
  const refresh = params.dataRetriever?.refresh;

  const tableData = useMemo(() => {
    return params.data.map((category: BlogCategoryInterface) => {
      const entry: TableContent<BlogCategoryInterface> = { jsonApiData: category };
      params.fields.forEach((field) => {
        entry[field] = (category as any)[field as keyof BlogCategoryInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<BlogCategoryFields, () => any>> = {
    [BlogCategoryFields.name]: () => ({
      id: BlogCategoryFields.name,
      accessorKey: BlogCategoryFields.name,
      header: t("blog.fields.name"),
      cell: ({ row }: { row: TableContent<BlogCategoryInterface> }) => {
        const category: BlogCategoryInterface = row.original.jsonApiData;
        return (
          <BlogCategoryEditor
            category={category}
            onSuccess={refresh}
            trigger={
              <button type="button" className="text-primary text-start font-medium">
                {blogCategoryAdminName(category) || category.id}
              </button>
            }
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [BlogCategoryFields.languages]: () => ({
      id: BlogCategoryFields.languages,
      accessorKey: BlogCategoryFields.languages,
      header: t("blog.fields.languages"),
      cell: ({ row }: { row: TableContent<BlogCategoryInterface> }) => {
        const category: BlogCategoryInterface = row.original.jsonApiData;
        const total = category.translations.length;
        if (total === 0) return <span className="text-muted-foreground text-xs">—</span>;
        const ready = category.translations.filter((translation) => translation.aiStatus === "completed").length;
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
      TableContent<BlogCategoryInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, refresh]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("blog-categories", useBlogCategoryTableStructure);
