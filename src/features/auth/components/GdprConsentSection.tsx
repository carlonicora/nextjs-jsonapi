"use client";

import { useTranslations } from "next-intl";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { GdprConsentCheckbox } from "../../../components/forms/GdprConsentCheckbox";
import { Link } from "../../../shadcnui";

interface GdprConsentSectionProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  termsCheckboxId?: Path<T>;
  marketingCheckboxId?: Path<T>;
}

export function GdprConsentSection<T extends FieldValues>({
  form,
  termsCheckboxId = "termsAccepted" as Path<T>,
  marketingCheckboxId = "marketingConsent" as Path<T>,
}: GdprConsentSectionProps<T>) {
  const t = useTranslations("auth.gdpr");

  const termsLabel = (
    <>
      {t("terms_prefix")}{" "}
      <Link href="/terms" target="_blank" rel="noopener" className="underline">
        {t("terms_of_service")}
      </Link>{" "}
      {t("and")}{" "}
      <Link href="/privacy" target="_blank" rel="noopener" className="underline">
        {t("privacy_policy")}
      </Link>
    </>
  );

  return (
    <div className="space-y-4 py-4">
      <GdprConsentCheckbox form={form} id={termsCheckboxId} label={termsLabel} required />
      <GdprConsentCheckbox
        form={form}
        id={marketingCheckboxId}
        label={t("marketing_consent")}
        description={t("marketing_description")}
      />
    </div>
  );
}
