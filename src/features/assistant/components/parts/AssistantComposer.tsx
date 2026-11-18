"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";
import { Button, Textarea } from "../../../../shadcnui";
import type { SkillInterface } from "../../../skill/data/SkillInterface";
import { SkillSlashMenu } from "../../../skill/components/parts/SkillSlashMenu";
import { filterSkills, findSkillTrigger } from "../../../skill/utils/skillTrigger";
import { useAssistantContextOptional } from "../../contexts/AssistantContext";

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
  /**
   * Rendered at the bottom-left of the input box, opposite the send button
   * (e.g. a scope picker). When omitted the box keeps its single-row layout.
   */
  leading?: ReactNode;
}

export function AssistantComposer({
  onSend,
  disabled,
  value: controlled,
  onValueChange,
  placeholder,
  sendLabel,
  leading,
}: Props) {
  const t = useTranslations();
  const [internal, setInternal] = useState("");
  const value = controlled ?? internal;
  const setValue = onValueChange ?? setInternal;

  // Skills apply only inside an operator-mode Assistant. Without a provider
  // (the handbook and Help mounts) the composer behaves exactly as before.
  const assistant = useAssistantContextOptional();
  const skillsOn = !!assistant?.operatorMode;
  const skills: SkillInterface[] = skillsOn ? (assistant?.skills ?? []) : [];

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const [trigger, setTrigger] = useState<{ start: number; query: string; caret: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const matches = trigger && skillsOn && !dismissed ? filterSkills(skills, trigger.query) : [];
  const menuOpen = matches.length > 0;

  const updateTrigger = (text: string, caret: number) => {
    if (!skillsOn) return;
    const next = findSkillTrigger(text, caret);
    if (!next) {
      setTrigger(null);
      setDismissed(false);
      return;
    }
    // Reload the list when a `/` starts, so a skill written meanwhile shows up.
    if (!trigger) void assistant?.refreshSkills();
    if (!trigger || trigger.query !== next.query || trigger.start !== next.start) setActiveIndex(0);
    setTrigger({ ...next, caret });
  };

  // Puts the caret after an inserted skill name once the new value is rendered.
  useEffect(() => {
    if (pendingCaret.current === null || !textareaRef.current) return;
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    textareaRef.current.setSelectionRange(caret, caret);
  }, [value]);

  const pick = (skill: SkillInterface) => {
    if (!trigger) return;
    const inserted = `/${skill.name} `;
    const next = value.slice(0, trigger.start) + inserted + value.slice(trigger.caret);
    pendingCaret.current = trigger.start + inserted.length;
    setTrigger(null);
    setDismissed(false);
    setValue(next);
    textareaRef.current?.focus();
  };

  const canSend = value.trim().length > 0 && !disabled;

  const submit = async () => {
    if (!canSend) return;
    const payload = value.trim();
    setValue("");
    setTrigger(null);
    setDismissed(false);
    await onSend(payload);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // The `/` menu's keys come first while it is open.
    if (menuOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const skill = matches[Math.min(activeIndex, matches.length - 1)];
        if (skill) pick(skill);
        return;
      }
      if (e.key === "Escape") {
        // Escape closes the menu only, never a sheet or dialog around the box.
        e.preventDefault();
        e.stopPropagation();
        setDismissed(true);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const textarea = (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        updateTrigger(e.target.value, e.target.selectionStart ?? e.target.value.length);
      }}
      onKeyDown={onKeyDown}
      // Read the list when the box gets focus, so the first `/` answers at once (spec section 8.3).
      onFocus={skillsOn ? () => void assistant?.refreshSkills() : undefined}
      placeholder={placeholder ?? t("features.assistant.composer_placeholder")}
      disabled={disabled}
      rows={2}
      className="min-h-[48px] resize-none border-0 bg-transparent focus-visible:ring-0"
    />
  );
  const sendButton = (
    <Button onClick={submit} disabled={!canSend} size="sm" className="h-8">
      <ArrowUp className="me-1 h-4 w-4" /> {sendLabel ?? t("features.assistant.send")}
    </Button>
  );

  const menu = menuOpen ? (
    <SkillSlashMenu skills={matches} query="" activeIndex={Math.min(activeIndex, matches.length - 1)} onPick={pick} />
  ) : null;

  return (
    <div className="flex flex-col gap-1 border-t p-4">
      {leading ? (
        <div className="bg-muted/30 relative flex flex-col gap-2 rounded-lg border p-2">
          {menu}
          {textarea}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">{leading}</div>
            {sendButton}
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 relative flex items-end gap-2 rounded-lg border p-2">
          {menu}
          {textarea}
          {sendButton}
        </div>
      )}
      <div className="text-muted-foreground text-end text-xs max-md:hidden">
        {t("features.assistant.keyboard_hint")}
      </div>
    </div>
  );
}
