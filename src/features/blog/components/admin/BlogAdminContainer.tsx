"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { AdministrationProvider } from "../../../administration/contexts/AdministrationContext";
import { BlogCategoriesList } from "./BlogCategoriesList";
import { BlogLayoutSetting } from "./BlogLayoutSetting";
import { BlogPostsList } from "./BlogPostsList";

/**
 * Blog admin page: posts, categories and the public list layout, one tab each.
 * Client component because `module={Modules.BlogPost}` carries an icon component.
 * Mirrors features/email-automation/components/containers/EmailAutomationsListContainer.tsx.
 */
export function BlogAdminContainer() {
  const t = useTranslations();

  return (
    <AdministrationProvider>
      <RoundPageContainer
        module={Modules.BlogPost}
        fullWidth
        tabs={[
          { sectionKey: "posts", label: t("blog.tabs.posts"), content: <BlogPostsList fullWidth /> },
          { sectionKey: "categories", label: t("blog.tabs.categories"), content: <BlogCategoriesList fullWidth /> },
          { sectionKey: "layout", label: t("blog.tabs.layout"), content: <BlogLayoutSetting /> },
        ]}
      />
    </AdministrationProvider>
  );
}
