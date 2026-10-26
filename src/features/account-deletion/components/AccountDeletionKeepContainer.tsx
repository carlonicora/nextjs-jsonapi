"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { SectionHeader } from "../../../components/typography";
import { buttonVariants } from "../../../shadcnui/ui/button";
import { Link } from "../../../shadcnui/custom/link";
import { AccountDeletionService } from "../data/account-deletion.service";

export type AccountDeletionKeepContainerProps = {
  /** The raw token from the "Keep my account" email link. */
  token: string | undefined;
};

type KeepState = "loading" | "success" | "failure";

/**
 * Landing page of the "Keep my account" email link: cancels the pending
 * deletion without a login. Every failure shows the same text, so the page
 * never tells whether an account exists.
 */
export function AccountDeletionKeepContainer({ token }: AccountDeletionKeepContainerProps) {
  const t = useTranslations();
  const [state, setState] = useState<KeepState>(token ? "loading" : "failure");
  // The token is single use: a second call (React Strict Mode runs effects
  // twice in development) would fail and replace the success text.
  const called = useRef(false);

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    AccountDeletionService.keep({ token })
      .then(() => setState("success"))
      .catch(() => setState("failure"));
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
        <p className="text-muted-foreground">{t("ui.buttons.loading")}</p>
      </div>
    );
  }

  if (state === "failure") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
        <div className="bg-destructive/10 rounded-full p-4">
          <XCircle className="text-destructive h-12 w-12" />
        </div>
        <p className="text-muted-foreground max-w-md">{t("accountDeletion.keep.failure")}</p>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          {t("accountDeletion.keep.login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
      <div className="bg-success/15 rounded-full p-4">
        <CheckCircle className="text-success h-12 w-12" />
      </div>
      <SectionHeader level={2}>{t("accountDeletion.keep.successTitle")}</SectionHeader>
      <p className="text-muted-foreground max-w-md">{t("accountDeletion.keep.successBody")}</p>
      <Link href="/login" className={buttonVariants()}>
        {t("accountDeletion.keep.login")}
      </Link>
    </div>
  );
}
