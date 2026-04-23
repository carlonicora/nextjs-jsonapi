"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface Props {
  status?: string;
}

export function AssistantStatusLine({ status }: Props) {
  const t = useTranslations();
  const text = status ?? t("features.assistant.thinking");
  return (
    <div className="text-muted-foreground flex items-center gap-2 px-4 py-2 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}
