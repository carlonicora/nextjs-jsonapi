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
 * utility) and renders the canonical cents as `"X.YZ"`, or as `"X,YZ"` when
 * `decimalSeparator` is `","`. With `","`, a dot-only value grouped in threes
 * (`1.000`, `1.234.567`) is read as thousands grouping, not as a decimal.
 * Thousands grouping is never displayed — this input is for editing;
 * presentation lives elsewhere (`formatCurrency`).
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
  /** Separator the value is displayed with. Defaults to `"."`. */
  decimalSeparator?: "." | ",";
};

function centsToInput(cents: number, decimalSeparator: "." | ","): string {
  const value = (cents / 100).toFixed(2);
  return decimalSeparator === "," ? value.replace(".", ",") : value;
}

function parseInput(raw: string, decimalSeparator: "." | ","): number {
  if (!raw || raw.trim() === "") return 0;
  const trimmed = raw.trim();
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  let normalized: string;
  if (decimalSeparator === "," && /^-?\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    normalized = trimmed.replace(/\./g, "");
  } else if (lastComma > lastDot) {
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

function sanitizeKeystroke(raw: string, decimalSeparator: "." | ","): string {
  let value = raw.replace(/[^0-9.,-]/g, "");
  // With a comma decimal, a dot may be thousands grouping (`1.234,56`), so every
  // separator is kept and `parseInput` reads the mix on blur.
  if (decimalSeparator === ",") return value;
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
  decimalSeparator = ".",
}: CurrencyInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft !== null ? draft : centsToInput(valueCents, decimalSeparator);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(sanitizeKeystroke(e.target.value, decimalSeparator));
  };

  const handleBlur = () => {
    if (draft === null) return;
    onChange(parseInput(draft, decimalSeparator));
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
