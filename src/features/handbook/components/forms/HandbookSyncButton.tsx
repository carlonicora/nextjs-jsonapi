"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "../../../../shadcnui";
import { showError, showToast } from "../../../../utils/toast";
import { HandbookPageService } from "../../data/HandbookPageService";

type HandbookSyncButtonProps = {
  refresh: () => Promise<void>;
};

/**
 * The sync control is a plain Button, not a trigger: it opens nothing, so the
 * render-prop composition rule for Base UI triggers does not apply here.
 */
export default function HandbookSyncButton({ refresh }: HandbookSyncButtonProps) {
  const t = useTranslations();
  const [isSyncing, setIsSyncing] = useState(false);

  const onSync = async () => {
    setIsSyncing(true);
    try {
      await HandbookPageService.sync();
      await refresh();
      showToast(t(`handbook.synced`));
    } catch {
      // The most common failure is a consumer with no `handbook.path`
      // configured, which the API answers with 400. Surface it and leave the
      // list untouched.
      showError(t(`handbook.syncFailed`));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={onSync} disabled={isSyncing}>
      {isSyncing ? t(`handbook.syncing`) : t(`handbook.sync`)}
    </Button>
  );
}
