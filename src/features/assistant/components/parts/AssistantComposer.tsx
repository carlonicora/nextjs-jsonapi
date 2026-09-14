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
  /**
   * Textarea placeholder. Defaults to the assistant's own copy ("ask me about a
   * matter, a client, a document…"), which is wrong on any surface that is not
   * the law-firm assistant.
   */
  placeholder?: string;
  /**
   * Label of the send button. Defaults to `ui.buttons.save`, which reads
   * "Salva" — correct nowhere in a chat, kept only so existing callers do not
   * move.
   */
  sendLabel?: string;
}

export function AssistantComposer({
  onSend,
  disabled,
  value: controlled,
  onValueChange,
  placeholder,
  sendLabel,
}: Props) {
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
          placeholder={placeholder ?? t("features.assistant.composer_placeholder")}
          disabled={disabled}
          rows={2}
          className="min-h-[48px] resize-none border-0 bg-transparent focus-visible:ring-0"
        />
        <Button onClick={submit} disabled={!canSend} size="sm" className="h-8">
          <ArrowUp className="me-1 h-4 w-4" /> {sendLabel ?? t("features.assistant.send")}
        </Button>
      </div>
      <div className="text-muted-foreground text-end text-xs">{t("features.assistant.keyboard_hint")}</div>
    </div>
  );
}
