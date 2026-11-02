"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../shadcnui";
import { useEmailAutomation } from "../../contexts/EmailAutomationContext";
import { EmailAutomationAddPersonDialog } from "../forms/EmailAutomationAddPersonDialog";
import { EmailAutomationEnrollmentFields } from "../../data/email-automation-enrollment.fields";
import { EmailAutomationEnrollmentInterface } from "../../data/EmailAutomationEnrollmentInterface";
import { EmailAutomationService } from "../../data/EmailAutomationService";

/**
 * List of the people in this automation (owner decision 6: no row actions; a
 * person is added by hand through "Add person" in the filters). Rendered inside
 * a tab, so it keeps its own bordered card (no `fullWidth`), as PricesList does
 * inside ProductContainer.
 */
export function EmailAutomationRecipientsList() {
  const t = useTranslations();
  const { automation, reload } = useEmailAutomation();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const data: DataListRetriever<EmailAutomationEnrollmentInterface> = useDataListRetriever({
    retriever: (params) => EmailAutomationService.findEnrollments(params),
    retrieverParams: { automationId: automation?.id },
    module: Modules.EmailAutomationEnrollment,
  });

  const handleStatusChange = (value: string | null) => {
    const status = value ?? "all";
    setStatusFilter(status);
    data.addAdditionalParameter("status", status === "all" ? null : status);
  };

  const statusItems = useMemo(
    () => ({
      all: t("emailAutomations.recipients.status.all"),
      active: t("emailAutomations.recipients.status.active"),
      completed: t("emailAutomations.recipients.status.completed"),
      unsubscribed: t("emailAutomations.recipients.status.unsubscribed"),
      exited: t("emailAutomations.recipients.status.exited"),
      failed: t("emailAutomations.recipients.status.failed"),
    }),
    [t],
  );

  const filters = (
    <div className="flex items-center gap-4">
      {automation && (
        <EmailAutomationAddPersonDialog
          automationId={automation.id}
          disabled={automation.stepCount === 0}
          onAdded={() => {
            void data.refresh();
            void reload();
          }}
        />
      )}

      <Select items={statusItems} value={statusFilter} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("emailAutomations.recipients.status.all")}</SelectItem>
          <SelectItem value="active">{t("emailAutomations.recipients.status.active")}</SelectItem>
          <SelectItem value="completed">{t("emailAutomations.recipients.status.completed")}</SelectItem>
          <SelectItem value="unsubscribed">{t("emailAutomations.recipients.status.unsubscribed")}</SelectItem>
          <SelectItem value="exited">{t("emailAutomations.recipients.status.exited")}</SelectItem>
          <SelectItem value="failed">{t("emailAutomations.recipients.status.failed")}</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={() => void data.refresh()} disabled={!data.isLoaded}>
        <RefreshCw className={`h-4 w-4 ${!data.isLoaded ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  return (
    <div data-testid="email-automation-recipients">
      <ContentListTable
        data={data}
        fields={[
          EmailAutomationEnrollmentFields.email,
          EmailAutomationEnrollmentFields.name,
          EmailAutomationEnrollmentFields.status,
          EmailAutomationEnrollmentFields.currentStep,
          EmailAutomationEnrollmentFields.nextSendAt,
          EmailAutomationEnrollmentFields.sentCount,
        ]}
        tableGeneratorType={Modules.EmailAutomationEnrollment}
        /* ContentListTable renders its filters only inside the title bar, so the
         list needs a title for "Add person" and the status filter to show. */
        title={t("emailAutomations.tabs.recipients")}
        filters={filters}
        /* The enrolments endpoint takes no search term, so rendering the box would
         give the page a control that silently does nothing. */
        allowSearch={false}
        emptyState={t("emailAutomations.recipients.empty")}
      />
    </div>
  );
}
