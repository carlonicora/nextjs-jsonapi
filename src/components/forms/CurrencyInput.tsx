"use client";

import React, { useState } from "react";
import { Input, InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../../shadcnui";

/**
 * Standalone (non-`Form*`) currency input that operates in integer cents.
 *
 * **Why this exists.** A controlled input whose displayed string is recomputed
 * from a canonical numeric value on every keystroke causes the browser caret
 * to jump to the end whenever the rendered string differs from what the user
 * just typed (e.g. typing "1" with selection "10.00" → onChange parses cents
 * → reformats to "1.00" → caret resets). To avoid that this component keeps
 * a **local draft string while focused** and only parses + commits the cents
 * value to the parent **on blur**. While typing, the input shows literally
 * what the user typed.
 *
 * Currency symbols and decimal-separator rules: the component accepts both
 * `,` and `.` as decimal separators (mirroring the codebase's `parseCurrencyInput`
 * utility) and renders the canonical cents → `"X.YZ"` via `(cents / 100).toFixed(2)`.
 * A localised display (e.g. `1.234,56`) is intentionally out of scope here —
 * this input is for editing; presentation lives elsewhere (`formatCurrency`).
 *
 * For form-bound inputs use `<FormInput type="currency" />`. This component
 * is for standalone (non-react-hook-form) usage such as table-row editors
 * where each row is local component state.
 */
export type CurrencyInputProps = {
  valueCents: number;
  onChange: (cents: number) => void;
  currencySymbol?: string;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  testId?: string;
};

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parseInput(raw: string): number {
  if (!raw || raw.trim() === "") return 0;
  const trimmed = raw.trim();
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  let normalized: string;
  if (lastComma > lastDot) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = trimmed.replace(/,/g, "");
  } else {
    normalized = trimmed.replace(",", ".");
  }
  const parsed = parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

function sanitizeKeystroke(raw: string): string {
  let value = raw.replace(/[^0-9.,-]/g, "");
  const firstSep = value.search(/[.,]/);
  if (firstSep !== -1) {
    const sep = value[firstSep];
    const before = value.slice(0, firstSep);
    const after = value.slice(firstSep + 1).replace(/[.,]/g, "");
    value = before + sep + after;
  }
  return value;
}

export function CurrencyInput({
  valueCents,
  onChange,
  currencySymbol = "€",
  readOnly,
  disabled,
  placeholder,
  className,
  testId,
}: CurrencyInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft !== null ? draft : centsToInput(valueCents);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(sanitizeKeystroke(e.target.value));
  };

  const handleBlur = () => {
    if (draft === null) return;
    onChange(parseInput(draft));
    setDraft(null);
  };

  const sharedProps = {
    type: "text" as const,
    inputMode: "decimal" as const,
    value: display,
    readOnly,
    disabled,
    placeholder,
    onChange: handleChange,
    onBlur: handleBlur,
    "data-testid": testId,
  };

  if (!currencySymbol) {
    return <Input {...sharedProps} className={`text-end ${className ?? ""}`.trim()} />;
  }

  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>{currencySymbol}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput {...sharedProps} className={`text-end ${className ?? ""}`.trim()} />
    </InputGroup>
  );
}
