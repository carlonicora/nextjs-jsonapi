"use client";

import { MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { EmptyState } from "../../../../shadcnui";
import { EmailAutomationFields } from "../../data/email-automation.fields";
import { EmailAutomationInterface } from "../../data/EmailAutomationInterface";
import { EmailAutomationService } from "../../data/EmailAutomationService";
import { EmailAutomationTriggerInterface } from "../../data/EmailAutomationTriggerInterface";
import EmailAutomationEditor from "../forms/EmailAutomationEditor";

type EmailAutomationsListProps = {
  /**
   * Pass this whenever the list is the page's own content inside a
   * `RoundPageContainer fullWidth`. Without it ContentListTable wraps itself in
   * `rounded-md border`, drawing a second bordered card inside the page's
   * rounded shell.
   */
  fullWidth?: boolean;
};

export function EmailAutomationsList({ fullWidth }: EmailAutomationsListProps = {}) {
  const t = useTranslations();
  const [triggers, setTriggers] = useState<EmailAutomationTriggerInterface[]>([]);

  const data: DataListRetriever<EmailAutomationInterface> = useDataListRetriever({
    retriever: (params) => EmailAutomationService.findMany(params),
    retrieverParams: {},
    module: Modules.EmailAutomation,
  });

  // The trigger column shows the label the app declares, not the stored key.
  useEffect(() => {
    let active = true;
    EmailAutomationService.findTriggers()
      .then((list) => {
        if (active) setTriggers(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const triggerLabels = useMemo(
    () => Object.fromEntries(triggers.map((trigger) => [trigger.key, trigger.label])),
    [triggers],
  );

  const functions: ReactNode[] = [<EmailAutomationEditor key="create-email-automation" />];

  return (
    <ContentListTable
      data={data}
      fields={[
        EmailAutomationFields.name,
        EmailAutomationFields.trigger,
        EmailAutomationFields.status,
        EmailAutomationFields.steps,
        EmailAutomationFields.active,
        EmailAutomationFields.completed,
        EmailAutomationFields.unsubscribed,
      ]}
      tableGeneratorType={Modules.EmailAutomation}
      functions={functions}
      fullWidth={fullWidth}
      title={t("emailAutomations.admin.title")}
      context={{ triggerLabels }}
      emptyState={<EmptyState icon={MailIcon} title={t("emailAutomations.admin.empty")} />}
    />
  );
}
