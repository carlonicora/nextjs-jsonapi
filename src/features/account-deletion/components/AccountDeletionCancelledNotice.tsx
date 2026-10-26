"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "../../../shadcnui/custom/link";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../../../shadcnui/ui/alert";
import { Button } from "../../../shadcnui/ui/button";
import { consumeAccountDeletionCancelled } from "../utils/account-deletion-notice";

export type AccountDeletionCancelledNoticeProps = {
  /** Where the user picks a plan again (their subscription was cancelled with the request). */
  choosePlanHref: string;
};

/**
 * Shown once, on the first page after a login that cancelled a pending account
 * deletion. The login paths set the flag; this reads and clears it.
 */
export function AccountDeletionCancelledNotice({ choosePlanHref }: AccountDeletionCancelledNoticeProps) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  // Read in an effect, never during render: sessionStorage is client-only and
  // the flag is consumed (a render-time read would differ between server and client).
  useEffect(() => {
    if (consumeAccountDeletionCancelled()) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <Alert className="border-success/30 bg-success/15 mb-4">
      <AlertTitle className="text-success">{t("accountDeletion.cancelled.title")}</AlertTitle>
      <AlertDescription>
        <p>{t("accountDeletion.cancelled.body")}</p>
        {/* Never underlined: colour and weight carry the affordance. */}
        <div className="mt-1">
          <Link href={choosePlanHref} className="text-primary font-medium">
            {t("accountDeletion.cancelled.choosePlan")}
          </Link>
        </div>
      </AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="icon-xs" aria-label={t("ui.labels.close")} onClick={() => setVisible(false)}>
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
}
