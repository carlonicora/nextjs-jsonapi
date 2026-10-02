"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../shadcnui";
import { MicroLabel } from "../../../../components/typography";

export interface OAuthCompanySelectorProps {
  /** The user's companies (studios) */
  companies: Array<{ id: string; name: string }>;
  /** The selected company id */
  value: string | undefined;
  /** Called with the newly selected company id */
  onChange: (id: string) => void;
}

/**
 * Studio (company) picker for the OAuth consent screen.
 * Renders nothing when the user belongs to a single company.
 */
export function OAuthCompanySelector({ companies, value, onChange }: OAuthCompanySelectorProps) {
  const t = useTranslations();

  const items = useMemo<Record<string, string>>(
    () => Object.fromEntries(companies.map((company) => [company.id, company.name])),
    [companies],
  );

  if (companies.length <= 1) return null;

  return (
    <div className="space-y-3">
      <MicroLabel as="h3">{t("oauth.consent.company_label")}</MicroLabel>
      <Select
        items={items}
        value={value ?? null}
        onValueChange={(selected) => {
          if (selected) onChange(String(selected));
        }}
      >
        <SelectTrigger className="w-full" aria-label={t("oauth.consent.company_label")}>
          <SelectValue placeholder={t("oauth.consent.company_label")} />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
