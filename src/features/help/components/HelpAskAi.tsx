"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SparklesIcon } from "lucide-react";
import { useCurrentUserContext } from "../../user/contexts/CurrentUserContext";
import { Button } from "../../../shadcnui";
import { useHelp } from "../contexts/HelpContext";

export function HelpAskAi({ howToId }: { howToId: string }) {
  const t = useTranslations();
  const { currentUser } = useCurrentUserContext();
  const { onAskAi } = useHelp();

  if (!currentUser) {
    return (
      <div className="text-muted-foreground text-sm">
        {t("help.askAi.loginPrompt")} ·{" "}
        <Link href="/login" className="text-foreground underline-offset-2 hover:underline">
          {t("help.askAi.loginCta")}
        </Link>
      </div>
    );
  }

  if (!onAskAi) return null;

  return (
    <Button variant="outline" size="sm" onClick={() => onAskAi(howToId)}>
      <SparklesIcon className="h-4 w-4" />
      {t("help.askAi.button")}
    </Button>
  );
}
