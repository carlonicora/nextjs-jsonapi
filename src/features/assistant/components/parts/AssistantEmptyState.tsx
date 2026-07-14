"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Label, Switch } from "../../../../shadcnui";
import { SectionHeader } from "../../../../components/typography";
import { AssistantComposer } from "./AssistantComposer";

interface Props {
  onSend: (content: string) => Promise<void>;
  /**
   * Operator engine toggle (durable, approval-gated runs). Rendered only when
   * `onOperatorModeChange` is provided; the default (responder) flow stays
   * unchanged otherwise.
   */
  operatorMode?: boolean;
  onOperatorModeChange?: (value: boolean) => void;
}

const STARTER_KEYS = ["a", "b", "c", "d"] as const;

export function AssistantEmptyState({ onSend, operatorMode = false, onOperatorModeChange }: Props) {
  const t = useTranslations();
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full w-full items-center justify-center p-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <SectionHeader>{t("features.assistant.empty_state.title")}</SectionHeader>
          <p className="text-muted-foreground mt-1 text-sm">{t("features.assistant.empty_state.subtitle")}</p>
        </div>
        <AssistantComposer value={draft} onValueChange={setDraft} onSend={onSend} />
        {onOperatorModeChange && (
          <div className="flex items-center justify-end gap-2">
            <Switch
              id="assistant-operator-mode"
              size="sm"
              checked={operatorMode}
              onCheckedChange={(checked) => onOperatorModeChange(checked === true)}
            />
            <Label htmlFor="assistant-operator-mode" className="text-muted-foreground text-xs">
              {t("features.assistant.operator_mode")}
            </Label>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {STARTER_KEYS.map((k) => {
            const text = t(`features.assistant.starters.${k}`);
            return (
              <button
                key={k}
                type="button"
                className="border-border bg-muted/30 hover:bg-muted rounded-lg border p-3 text-left text-sm"
                onClick={() => setDraft(text)}
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
