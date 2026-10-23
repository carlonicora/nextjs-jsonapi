"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../../components";
import { SharedProvider } from "../../../../contexts/SharedContext";
import { Modules } from "../../../../core";
import { BreadcrumbItemData } from "../../../../interfaces";
import { EmailAutomationsList } from "../lists/EmailAutomationsList";

/**
 * Page container for the administrative email-automation list.
 *
 * Client component by necessity: `module={Modules.EmailAutomation}` is a
 * registry entry carrying an icon component and methods, which a Server
 * Component cannot pass across the boundary. Routes mount this container
 * instead — the same shape as every other list page.
 *
 * No `forceHeader`: ContentListTable draws its own header row with the title
 * and the create action, exactly as the company and user list pages do.
 *
 * Publishes its own breadcrumb, as CompanyProvider does for the companies list:
 * the list root comes first and has no href because it is the current page.
 */
export function EmailAutomationsListContainer() {
  const t = useTranslations();

  const breadcrumbs: BreadcrumbItemData[] = [{ name: t("emailAutomations.admin.title") }];

  return (
    <SharedProvider value={{ breadcrumbs, title: { type: t("emailAutomations.admin.title") } }}>
      <RoundPageContainer module={Modules.EmailAutomation} fullWidth>
        <EmailAutomationsList fullWidth />
      </RoundPageContainer>
    </SharedProvider>
  );
}
