"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../../components";
import { SharedProvider } from "../../../../contexts/SharedContext";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { BreadcrumbItemData } from "../../../../interfaces";
import { EmailAutomationProvider, useEmailAutomation } from "../../contexts/EmailAutomationContext";
import { EmailAutomationActiveSwitch } from "../canvas/EmailAutomationActiveSwitch";
import { EmailAutomationCanvasTab } from "../canvas/EmailAutomationCanvasTab";
import { EmailAutomationEditor } from "../forms/EmailAutomationEditor";
import { EmailAutomationRecipientsList } from "../lists/EmailAutomationRecipientsList";

export type EmailAutomationContainerProps = {
  automationId: string;
};

export function EmailAutomationContainer({ automationId }: EmailAutomationContainerProps) {
  return (
    <EmailAutomationProvider automationId={automationId}>
      <EmailAutomationShell />
    </EmailAutomationProvider>
  );
}

function EmailAutomationShell() {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { automation, reload } = useEmailAutomation();

  if (!automation) return null;

  const breadcrumbs: BreadcrumbItemData[] = [
    { name: t("emailAutomations.admin.title"), href: generateUrl({ page: Modules.EmailAutomation }) },
    { name: automation.name },
  ];

  // The page chrome (title + header functions) is published here rather than by
  // AdministrationProvider: SharedProvider replaces its value for the subtree,
  // so this one carries the administration title type plus the automation name.
  return (
    <SharedProvider
      value={{
        breadcrumbs,
        title: {
          type: t("emailAutomations.admin.title"),
          element: automation.name,
          functions: [
            <EmailAutomationActiveSwitch key="emailAutomationActiveSwitch" />,
            <EmailAutomationEditor key="emailAutomationEditor" automation={automation} onSuccess={reload} />,
          ],
        },
      }}
    >
      <RoundPageContainer
        module={Modules.EmailAutomation}
        id={automation.id}
        fullWidth
        forceHeader
        // The canvas is sized h-full: it needs the viewport-bound shell and a
        // fillHeight tab, or it resolves to zero height.
        scroll="fixed"
        tabs={[
          {
            sectionKey: "canvas",
            label: t("emailAutomations.tabs.canvas"),
            content: <EmailAutomationCanvasTab />,
            fillHeight: true,
          },
          {
            sectionKey: "recipients",
            label: t("emailAutomations.tabs.recipients"),
            content: <EmailAutomationRecipientsList />,
          },
        ]}
      />
    </SharedProvider>
  );
}
