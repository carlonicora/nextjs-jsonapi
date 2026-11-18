"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { errorToast } from "../../../../components/errors/errorToast";
import { Switch } from "../../../../shadcnui/ui/switch";
import { SkillInterface } from "../../data/SkillInterface";
import { SkillService } from "../../data/SkillService";

export type SkillScope = "company" | "global";

/** HTTP status of a failed `callApi`, when it carries one. */
export function skillErrorStatus(error: unknown): number | undefined {
  return (error as { status?: number } | undefined)?.status;
}

/**
 * True when the refusal carries the server's `skill.<code>` message (`callApi`
 * errors read `<status>:<message>`). The code is passed without its `skill.`
 * prefix so the message validator does not read it as a text key.
 */
export function skillErrorHas(error: unknown, code: string): boolean {
  return String((error as { message?: string } | undefined)?.message ?? "").includes(`skill.${code}`);
}

/**
 * The list switch of one skill. Optimistic, built like Wyrdli's ShareToggleCell:
 * it flips on click, saves at once, and flips back with a message if the save
 * fails. A 404 or 409 means the list is out of date: `onChanged` reloads it.
 */
export function SkillSwitchCell({
  skill,
  scope,
  companyId,
  onSaved,
  onChanged,
}: {
  skill: SkillInterface;
  scope: SkillScope;
  /** Administration: the picked company, whose routes the switch calls (company scope only). */
  companyId?: string;
  /** Swaps the saved skill into the loaded list: no refetch, so the row stays where it is. */
  onSaved?: (skill: SkillInterface) => void;
  /** The skill changed elsewhere: reload the list. */
  onChanged?: () => void;
}) {
  const t = useTranslations();
  const [checked, setChecked] = useState<boolean>(skill.isEnabled);
  useEffect(() => setChecked(skill.isEnabled), [skill.isEnabled]);

  if (skill.isHidden)
    return (
      <span className="text-muted-foreground text-xs/relaxed" data-testid={`skill-hidden-${skill.name}`}>
        {t("skill.hidden")}
      </span>
    );

  const save = (next: boolean): Promise<SkillInterface> => {
    if (scope === "global") {
      const params = { id: skill.id };
      return next ? SkillService.enableGlobal(params) : SkillService.disableGlobal(params);
    }
    const params = companyId ? { id: skill.id, companyId } : { id: skill.id };
    return next ? SkillService.enable(params) : SkillService.disable(params);
  };

  return (
    <Switch
      size="sm"
      checked={checked}
      aria-label={t("skill.columns.active")}
      data-testid={`skill-switch-${skill.name}`}
      onCheckedChange={async (next: boolean) => {
        setChecked(next);
        try {
          const saved = await save(next);
          if (saved) onSaved?.(saved);
          else setChecked(!next);
        } catch (error) {
          setChecked(!next);
          const status = skillErrorStatus(error);
          if (status === 404 || status === 409) {
            errorToast({ title: t("skill.errors.changed"), error });
            onChanged?.();
            return;
          }
          errorToast({ title: t("skill.errors.switch"), error });
        }
      }}
    />
  );
}
