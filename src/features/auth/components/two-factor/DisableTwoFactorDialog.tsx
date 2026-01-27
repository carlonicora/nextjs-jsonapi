"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components/errors/errorToast";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { TwoFactorService } from "../../data/two-factor.service";
import { TotpInput } from "./TotpInput";

interface DisableTwoFactorDialogProps {
  onSuccess: () => void;
  trigger?: React.ReactElement;
}

export function DisableTwoFactorDialog({ onSuccess, trigger }: DisableTwoFactorDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleVerify = async (code: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      await TwoFactorService.disable({ code });
      showToast(t("auth.two_factor.disabled_success"));
      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(t("auth.two_factor.invalid_code"));
      errorToast({ title: t("common.errors.error"), error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setError(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button variant="destructive">{t("auth.two_factor.disable")}</Button>} />
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.two_factor.disable_2fa")}</DialogTitle>
          <DialogDescription>{t("auth.two_factor.disable_warning")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">{t("auth.two_factor.enter_code_to_disable")}</p>
          <TotpInput onComplete={handleVerify} disabled={isLoading} error={error} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
