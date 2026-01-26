"use client";

import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function WaitlistSuccessState() {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
      <div className="bg-primary/10 rounded-full p-4">
        <CheckCircle className="text-primary h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold">{t("waitlist.success.title")}</h2>
      <p className="text-muted-foreground max-w-md">{t("waitlist.success.description")}</p>
      <p className="text-muted-foreground text-sm">{t("waitlist.success.hint")}</p>
    </div>
  );
}
