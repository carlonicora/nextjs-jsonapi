"use client";

import { NewspaperIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { Button, EmptyState } from "../../../../shadcnui";
import { BlogPostFields, BlogPostInterface, BlogPostService } from "../../data";
import "../../hooks/useBlogPostTableStructure";
import { BlogPostEditor } from "./BlogPostEditor";

type BlogPostsListProps = {
  /** Pass only when the list is the page's whole content inside a `RoundPageContainer fullWidth`; omit it in a tab so the list keeps its bordered card. */
  fullWidth?: boolean;
};

/** Admin posts table. Mirrors features/email-automation/components/lists/EmailAutomationsList.tsx. */
export function BlogPostsList({ fullWidth }: BlogPostsListProps = {}) {
  const t = useTranslations();

  const data: DataListRetriever<BlogPostInterface> = useDataListRetriever({
    retriever: (params) => BlogPostService.findMany(params),
    retrieverParams: {},
    module: Modules.BlogPost,
  });

  // Creating navigates to the new post's page (EditorSheet's default without onSuccess).
  const functions: ReactNode[] = [
    <BlogPostEditor
      key="create-blog-post"
      trigger={
        <Button render={<div />} nativeButton={false} size="sm" variant="outline">
          {t("blog.admin.newPost")}
        </Button>
      }
    />,
  ];

  return (
    <ContentListTable
      data={data}
      fields={[
        BlogPostFields.title,
        BlogPostFields.status,
        BlogPostFields.categories,
        BlogPostFields.publishedAt,
        BlogPostFields.languages,
      ]}
      tableGeneratorType={Modules.BlogPost}
      functions={functions}
      fullWidth={fullWidth}
      title={t("blog.entities.posts")}
      emptyState={<EmptyState icon={NewspaperIcon} title={t("blog.admin.empty")} />}
    />
  );
}
