"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { AssistantComposer } from "./AssistantComposer";

interface Props {
  onSend: (content: string) => Promise<void>;
}

const STARTER_KEYS = ["a", "b", "c", "d"] as const;

export function AssistantEmptyState({ onSend }: Props) {
  const t = useTranslations();
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full w-full items-center justify-center p-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-foreground text-xl font-semibold">{t("features.assistant.empty_state.title")}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{t("features.assistant.empty_state.subtitle")}</p>
        </div>
        <AssistantComposer value={draft} onValueChange={setDraft} onSend={onSend} />
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
