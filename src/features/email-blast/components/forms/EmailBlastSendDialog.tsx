"use client";

import { LoaderCircleIcon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { errorToast } from "../../../../components/errors/errorToast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../../shadcnui/ui/alert-dialog";
import { Button } from "../../../../shadcnui/ui/button";
import { EmailBlastInterface } from "../../data/EmailBlastInterface";
import { EmailBlastService } from "../../data/EmailBlastService";

export type EmailBlastSendDialogProps = {
  blast: EmailBlastInterface;
  onSuccess?: () => void | Promise<void>;
};

/**
 * Header action on a draft blast: asks how many people it reaches now, then sends.
 * Same AlertDialog shape as AccountDeletionAdminTrigger.
 */
export function EmailBlastSendDialog({ blast, onSuccess }: EmailBlastSendDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState<boolean>(false);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [isSending, setIsSending] = useState<boolean>(false);

  // The count is read each time the dialog opens: consent and opt-outs change.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCount(undefined);
    EmailBlastService.findAudience({ id: blast.id })
      .then((audience) => {
        if (!cancelled) setCount(audience.recipientCount);
      })
      .catch((error) => {
        if (!cancelled) errorToast({ title: t("common.errors.error"), error });
      });
    return () => {
      cancelled = true;
    };
  }, [open, blast.id, t]);

  const isLoading = count === undefined;
  const canSend = !isLoading && count > 0 && !isSending;

  const handleSend = async () => {
    setIsSending(true);
    try {
      await EmailBlastService.send({ id: blast.id });
      await onSuccess?.();
      setOpen(false);
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button size="sm" variant="default" />}>
        <SendIcon />
        {t("emailBlasts.send.button")}
      </AlertDialogTrigger>
      <AlertDialogContent className="flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("emailBlasts.send.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading ? (
              <LoaderCircleIcon className="animate-spin-slow h-5 w-5" />
            ) : count === 0 ? (
              t("emailBlasts.send.nobody")
            ) : (
              t("emailBlasts.send.confirm", { count })
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end">
          <Button className="me-2" variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSending}>
            {t("emailBlasts.send.cancel")}
          </Button>
          <Button type="button" variant="default" onClick={handleSend} disabled={!canSend}>
            {isSending ? (
              <>
                {t("emailBlasts.send.action")}
                <LoaderCircleIcon className="animate-spin-slow h-5 w-5" />
              </>
            ) : (
              t("emailBlasts.send.action")
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
