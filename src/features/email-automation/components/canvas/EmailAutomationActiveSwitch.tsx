"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components";
import { Switch, Tooltip, TooltipContent, TooltipTrigger } from "../../../../shadcnui";
import { useEmailAutomation } from "../../contexts/EmailAutomationContext";
import { EmailAutomationService } from "../../data/EmailAutomationService";

/**
 * Inline on/off for the automation page header, so pausing never needs the
 * editor sheet. Off holds every enrolment in place (spec § "Sending" 3).
 */
export function EmailAutomationActiveSwitch() {
  const t = useTranslations();
  const { automation, reload } = useEmailAutomation();
  const [saving, setSaving] = useState<boolean>(false);

  if (!automation) return null;

  const toggle = async (checked: boolean) => {
    setSaving(true);
    try {
      await EmailAutomationService.update({
        id: automation.id,
        name: automation.name,
        trigger: automation.trigger,
        exitTrigger: automation.exitTrigger,
        replyTo: automation.replyTo,
        isActive: checked,
      });
      await reload();
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger render={<label className="flex items-center gap-x-2" />}>
        <Switch checked={automation.isActive} onCheckedChange={(checked) => void toggle(checked)} disabled={saving} />
        <span className="text-xs">{t("emailAutomations.fields.isActive.label")}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{t("emailAutomations.fields.isActive.help")}</TooltipContent>
    </Tooltip>
  );
}
