"use client";
import { useState } from "react";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUserContext } from "../../user/contexts/CurrentUserContext";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "../../../shadcnui";
import { HelpAssistantSheet } from "./HelpAssistantSheet";

export function HelpAskAi() {
  const t = useTranslations();
  const { currentUser } = useCurrentUserContext();
  const [open, setOpen] = useState(false);
  const disabled = !currentUser;

  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="sm" disabled />}>
          <SparklesIcon className="h-4 w-4" />
          {t("help.askAi.button")}
        </TooltipTrigger>
        <TooltipContent>{t("help.askAi.loginTooltip")}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <SparklesIcon className="h-4 w-4" />
        {t("help.askAi.button")}
      </Button>
      <HelpAssistantSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
