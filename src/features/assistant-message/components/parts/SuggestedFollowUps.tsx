"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  questions: string[];
  onSelect: (q: string) => void;
}

export function SuggestedFollowUps({ questions, onSelect }: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  if (questions.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-primary inline-flex items-center gap-1 text-xs font-medium"
      >
        {open ? (
          <>
            <ChevronDown className="h-3 w-3" />
            {t("features.assistant.hide_suggestions")}
          </>
        ) : (
          <>
            <ChevronRight className="h-3 w-3" />
            {t("features.assistant.show_suggestions", { count: questions.length })}
          </>
        )}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1">
          {questions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelect(q)}
              className="border-border bg-muted/30 hover:bg-muted rounded-md border px-3 py-1.5 text-left text-sm"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
