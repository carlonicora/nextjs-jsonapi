"use client";

import { LoaderCircleIcon, MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { CommonDeleter, RoundPageContainer } from "../../../../components";
import { errorToast } from "../../../../components/errors/errorToast";
import { DetailField } from "../../../../components/typography";
import { SharedProvider } from "../../../../contexts/SharedContext";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { useI18nLocale } from "../../../../i18n";
import { BreadcrumbItemData } from "../../../../interfaces";
import { Badge, Button } from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { EmailBlastInterface, EmailBlastStatus } from "../../data/EmailBlastInterface";
import { EmailBlastService } from "../../data/EmailBlastService";
import { EmailBlastEditor } from "../forms/EmailBlastEditor";
import { EmailBlastSendDialog } from "../forms/EmailBlastSendDialog";

const STATUS_VARIANTS: Record<EmailBlastStatus, "softGray" | "softAmber" | "softGreen"> = {
  draft: "softGray",
  sending: "softAmber",
  sent: "softGreen",
};

export type EmailBlastContainerProps = {
  blastId: string;
};

function EmailBlastSendTestButton({ blast }: { blast: EmailBlastInterface }) {
  const t = useTranslations();
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleClick = async () => {
    setIsSending(true);
    try {
      await EmailBlastService.sendTest({ id: blast.id });
      showToast(t("emailBlasts.test.sent"));
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button size="sm" variant="outline" type="button" onClick={handleClick} disabled={isSending}>
      {isSending ? <LoaderCircleIcon className="animate-spin-slow" /> : <MailCheckIcon />}
      {t("emailBlasts.test.button")}
    </Button>
  );
}

export function EmailBlastContainer({ blastId }: EmailBlastContainerProps) {
  const t = useTranslations();
  const locale = useI18nLocale();
  const generateUrl = usePageUrlGenerator();
  const [blast, setBlast] = useState<EmailBlastInterface | undefined>(undefined);

  const reload = useCallback(async () => {
    setBlast(await EmailBlastService.findOne({ id: blastId }));
  }, [blastId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!blast) return null;

  const listUrl = generateUrl({ page: Modules.EmailBlast });

  const breadcrumbs: BreadcrumbItemData[] = [
    { name: t("emailBlasts.admin.title"), href: listUrl },
    { name: blast.subject },
  ];

  // Only a draft can be edited, test-sent, sent or deleted (the API refuses the rest).
  const functions: ReactNode[] =
    blast.status === "draft"
      ? [
          <EmailBlastEditor key="emailBlastEditor" blast={blast} onSuccess={reload} />,
          <EmailBlastSendTestButton key="emailBlastSendTest" blast={blast} />,
          <EmailBlastSendDialog key="emailBlastSendDialog" blast={blast} onSuccess={reload} />,
          <CommonDeleter
            key="emailBlastDeleter"
            type="email-blasts"
            deleteFunction={() => EmailBlastService.delete({ id: blast.id })}
            redirectTo={listUrl}
          />,
        ]
      : [];

  // The page chrome (title + header functions) is published here rather than by
  // AdministrationProvider: SharedProvider replaces its value for the subtree,
  // so this one carries the administration title type plus the blast subject.
  return (
    <SharedProvider
      value={{
        breadcrumbs,
        title: {
          type: t("emailBlasts.admin.title"),
          element: blast.subject,
          functions,
        },
      }}
    >
      <RoundPageContainer module={Modules.EmailBlast} id={blast.id} fullWidth forceHeader>
        <div className="flex w-full flex-col gap-y-6 p-4">
          <div>
            <Badge variant={STATUS_VARIANTS[blast.status]}>{t(`emailBlasts.list.status.${blast.status}`)}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <DetailField
              label={t("emailBlasts.detail.recipients")}
              value={<span className="tabular-nums">{blast.recipientCount ?? "—"}</span>}
            />
            <DetailField
              label={t("emailBlasts.detail.sentTo")}
              value={<span className="tabular-nums">{blast.sentCount}</span>}
            />
            <DetailField
              label={t("emailBlasts.detail.failed")}
              value={<span className="tabular-nums">{blast.failedCount}</span>}
            />
            <DetailField
              label={t("emailBlasts.detail.unsubscribed")}
              value={<span className="tabular-nums">{blast.unsubscribedCount}</span>}
            />
          </div>
          <DetailField
            label={t("emailBlasts.detail.sentAt")}
            value={blast.sentAt ? blast.sentAt.toLocaleString(locale) : "—"}
          />
          <DetailField label={t("emailBlasts.list.columns.subject")} value={blast.subject} />
          <DetailField label={t("emailBlasts.detail.replyTo")} value={blast.replyTo ?? "—"} />
          <DetailField
            label={t("emailBlasts.detail.body")}
            value={<div className="whitespace-pre-wrap leading-relaxed">{blast.body}</div>}
          />
        </div>
      </RoundPageContainer>
    </SharedProvider>
  );
}
