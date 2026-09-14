"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "../../../../shadcnui";
import { showError, showToast } from "../../../../utils/toast";
import { HowToService } from "../../data/HowToService";

type HowToReindexButtonProps = {
  refresh: () => Promise<void>;
};

/**
 * Re-queues every guide for chunking.
 *
 * Guides are chunked on create and update only, so one written before chunking
 * existed — or one whose chunks were dropped — is invisible to the help chat
 * with no way back in. This is the way back in.
 *
 * The control is a plain Button, not a trigger: it opens nothing, so the
 * render-prop composition rule for Base UI triggers does not apply here.
 */
export default function HowToReindexButton({ refresh }: HowToReindexButtonProps) {
  const t = useTranslations();
  const [isReindexing, setIsReindexing] = useState(false);

  const onReindex = async () => {
    setIsReindexing(true);
    try {
      await HowToService.reindex();
      await refresh();
      showToast(t(`howto.reindex.done`));
    } catch {
      showError(t(`howto.reindex.failed`));
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <Button variant="outline" onClick={onReindex} disabled={isReindexing}>
      {isReindexing ? t(`howto.reindex.running`) : t(`howto.reindex.action`)}
    </Button>
  );
}
