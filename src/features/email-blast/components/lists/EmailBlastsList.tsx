"use client";

import { SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { EmptyState } from "../../../../shadcnui";
import { EmailBlastFields } from "../../data/email-blast.fields";
import { EmailBlastInterface } from "../../data/EmailBlastInterface";
import { EmailBlastService } from "../../data/EmailBlastService";
// Registers the "email-blasts" table generator. The blast components ship in the
// shared ./components entry, which does not re-export feature hooks (HowToList pattern).
import "../../hooks/useEmailBlastTableStructure";
import EmailBlastEditor from "../forms/EmailBlastEditor";

type EmailBlastsListProps = {
  /**
   * Pass this whenever the list is the page's own content inside a
   * `RoundPageContainer fullWidth`. Without it ContentListTable wraps itself in
   * `rounded-md border`, drawing a second bordered card inside the page's
   * rounded shell.
   */
  fullWidth?: boolean;
};

export function EmailBlastsList({ fullWidth }: EmailBlastsListProps = {}) {
  const t = useTranslations();

  const data: DataListRetriever<EmailBlastInterface> = useDataListRetriever({
    retriever: (params) => EmailBlastService.findMany(params),
    retrieverParams: {},
    module: Modules.EmailBlast,
  });

  const functions: ReactNode[] = [<EmailBlastEditor key="create-email-blast" />];

  return (
    <ContentListTable
      data={data}
      fields={[
        EmailBlastFields.subject,
        EmailBlastFields.status,
        EmailBlastFields.sentAt,
        EmailBlastFields.sent,
        EmailBlastFields.failed,
        EmailBlastFields.unsubscribed,
      ]}
      tableGeneratorType={Modules.EmailBlast}
      functions={functions}
      fullWidth={fullWidth}
      title={t("emailBlasts.admin.title")}
      emptyState={<EmptyState icon={SendIcon} title={t("emailBlasts.admin.empty")} />}
    />
  );
}
