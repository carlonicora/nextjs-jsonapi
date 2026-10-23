"use client";

import { TagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { Button, EmptyState } from "../../../../shadcnui";
import { BlogCategoryFields, BlogCategoryInterface, BlogCategoryService } from "../../data";
import "../../hooks/useBlogCategoryTableStructure";
import { BlogCategoryEditor } from "./BlogCategoryEditor";

type BlogCategoriesListProps = {
  /** Pass only when the list is the page's whole content inside a `RoundPageContainer fullWidth`; omit it in a tab so the list keeps its bordered card. */
  fullWidth?: boolean;
};

/**
 * Admin categories table. Categories have no page of their own: creating and
 * editing both stay on this tab and refresh the list.
 * Mirrors features/email-automation/components/lists/EmailAutomationsList.tsx.
 */
export function BlogCategoriesList({ fullWidth }: BlogCategoriesListProps = {}) {
  const t = useTranslations();

  const data: DataListRetriever<BlogCategoryInterface> = useDataListRetriever({
    retriever: (params) => BlogCategoryService.findMany(params),
    retrieverParams: {},
    module: Modules.BlogCategory,
  });

  const functions: ReactNode[] = [
    <BlogCategoryEditor
      key="create-blog-category"
      onSuccess={data.refresh}
      trigger={
        <Button render={<div />} nativeButton={false} size="sm" variant="outline">
          {t("blog.admin.newCategory")}
        </Button>
      }
    />,
  ];

  return (
    <ContentListTable
      data={data}
      fields={[BlogCategoryFields.name, BlogCategoryFields.languages]}
      tableGeneratorType={Modules.BlogCategory}
      functions={functions}
      fullWidth={fullWidth}
      title={t("blog.entities.categories")}
      emptyState={<EmptyState icon={TagIcon} title={t("blog.admin.emptyCategories")} />}
    />
  );
}
