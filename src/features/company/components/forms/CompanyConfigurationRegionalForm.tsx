"use client";

import { useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import { FormFieldWrapper } from "../../../../components/forms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../shadcnui";

type RegionalConfigurationFormProps = {
  form: UseFormReturn<any>;
  currencyOptions?: string[];
};

const COUNTRIES = [
  { code: "IT", name: "Italy" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "NL", name: "Netherlands" },
  { code: "PT", name: "Portugal" },
  { code: "CH", name: "Switzerland" },
];

export function CompanyConfigurationRegionalForm({ form, currencyOptions = ["EUR"] }: RegionalConfigurationFormProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div className="space-y-4 border-t pt-4">
        <FormFieldWrapper form={form} name="country" label={t("features.configuration.country")} isRequired={false}>
          {(field) => (
            <Select value={field.value ?? "IT"} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("features.configuration.country_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormFieldWrapper>

        <FormFieldWrapper form={form} name="currency" label={t("features.configuration.currency")} isRequired={false}>
          {(field) => (
            <Select value={field.value ?? "EUR"} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("features.configuration.currency_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormFieldWrapper>
      </div>
    </div>
  );
}
