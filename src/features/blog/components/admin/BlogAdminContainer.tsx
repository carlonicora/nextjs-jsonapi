"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../../components";
import { SharedProvider } from "../../../../contexts/SharedContext";
import { Modules } from "../../../../core";
import { BreadcrumbItemData } from "../../../../interfaces";
import { BlogCategoriesList } from "./BlogCategoriesList";
import { BlogLayoutSetting } from "./BlogLayoutSetting";
import { BlogPostsList } from "./BlogPostsList";

/**
 * Blog admin page: posts, categories and the public list layout, one tab each.
 * Client component because `module={Modules.BlogPost}` carries an icon component.
 * Mirrors features/email-automation/components/containers/EmailAutomationsListContainer.tsx.
 *
 * Publishes its own breadcrumb, as CompanyProvider does for the companies list:
 * the list root comes first and has no href because it is the current page.
 * The lists inside the tabs omit `fullWidth` so they keep their bordered card,
 * as PricesList does inside ProductContainer.
 */
export function BlogAdminContainer() {
  const t = useTranslations();

  const breadcrumbs: BreadcrumbItemData[] = [{ name: t("blog.admin.title") }];

  return (
    <SharedProvider value={{ breadcrumbs, title: { type: t("blog.admin.title") } }}>
      <RoundPageContainer
        module={Modules.BlogPost}
        tabs={[
          { sectionKey: "posts", label: t("blog.tabs.posts"), content: <BlogPostsList /> },
          { sectionKey: "categories", label: t("blog.tabs.categories"), content: <BlogCategoriesList /> },
          { sectionKey: "layout", label: t("blog.tabs.layout"), content: <BlogLayoutSetting /> },
        ]}
      />
    </SharedProvider>
  );
}
