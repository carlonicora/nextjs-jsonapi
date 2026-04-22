"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";
import { Button, Textarea } from "../../../../shadcnui";

interface Props {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  value?: string;
  onValueChange?: (v: string) => void;
}

export function AssistantComposer({ onSend, disabled, value: controlled, onValueChange }: Props) {
  const t = useTranslations();
  const [internal, setInternal] = useState("");
  const value = controlled ?? internal;
  const setValue = onValueChange ?? setInternal;

  const canSend = value.trim().length > 0 && !disabled;

  const submit = async () => {
    if (!canSend) return;
    const payload = value.trim();
    setValue("");
    await onSend(payload);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="flex flex-col gap-1 border-t p-4">
      <div className="bg-muted/30 flex items-end gap-2 rounded-lg border p-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("features.assistant.composer_placeholder")}
          disabled={disabled}
          rows={2}
          className="min-h-[48px] resize-none border-0 bg-transparent focus-visible:ring-0"
        />
        <Button onClick={submit} disabled={!canSend} size="sm" className="h-8">
          <ArrowUp className="mr-1 h-4 w-4" /> {t("ui.buttons.save")}
        </Button>
      </div>
      <div className="text-muted-foreground text-right text-xs">
        {t("features.assistant.keyboard_hint")}
      </div>
    </div>
  );
}
