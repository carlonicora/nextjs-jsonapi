"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { buttonVariants, Link } from "../../../../shadcnui";
import { WaitlistService } from "../../data/WaitlistService";

interface Props {
  code: string;
}

type ConfirmationState = "loading" | "success" | "error";

export function WaitlistConfirmation({ code }: Props) {
  const t = useTranslations();
  const [state, setState] = useState<ConfirmationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function confirmEmail() {
      try {
        await WaitlistService.confirm(code);
        setState("success");
      } catch (error) {
        setState("error");
        setErrorMessage(error instanceof Error ? error.message : t("waitlist.confirmation.error_default"));
      }
    }

    confirmEmail();
  }, [code, t]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
        <p className="text-muted-foreground">{t("waitlist.confirmation.loading")}</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
        <div className="bg-destructive/10 rounded-full p-4">
          <XCircle className="text-destructive h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold">{t("waitlist.confirmation.error_title")}</h2>
        <p className="text-muted-foreground max-w-md">{errorMessage}</p>
        <Link href="/waitlist" className={buttonVariants({ variant: "outline" })}>
          {t("waitlist.buttons.return")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
      <div className="bg-primary/10 rounded-full p-4">
        <CheckCircle className="text-primary h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold">{t("waitlist.confirmation.success_title")}</h2>
      <p className="text-muted-foreground max-w-md">{t("waitlist.confirmation.success_description")}</p>
      <p className="text-muted-foreground text-sm">{t("waitlist.confirmation.success_hint")}</p>
    </div>
  );
}
