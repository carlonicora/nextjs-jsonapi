"use client";

import { useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import { FormFieldWrapper } from "../../../../components/forms";
import { Checkbox, Input } from "../../../../shadcnui";

type SecurityConfigurationFormProps = {
  form: UseFormReturn<any>;
};

type Fields = {
  fields: string[];
  defaults: Record<string, any>;
};

const providerConfig: Fields = {
  fields: ["isManagedKnowledge", "allowPublicBot"],
  defaults: {},
};

export function CompanyConfigurationSecurityForm({ form }: SecurityConfigurationFormProps) {
  const _t = useTranslations();

  const renderProviderFields = () => {
    const config = providerConfig;
    if (!config) return null;

    return config.fields.map((currentField) => {
      const isRequired = currentField === "";

      let label = "";
      let placeholder = "";
      let type = "text";

      switch (currentField) {
        case "isManagedKnowledge":
          label = "Limit Require structured knowledge management";
          placeholder =
            "Enforce single-nesting expertises, require expertise associations to content, and enable knowledge manager roles for better long-term organization.";
          type = "checkbox";
          break;
        case "allowPublicBot":
          label = "Allow Public Bot";
          placeholder = "Enable this to allow the public to access public information.";
          type = "checkbox";
          break;
      }

      return (
        <FormFieldWrapper
          key={currentField}
          form={form}
          name={currentField}
          label={label}
          description={type === "checkbox" ? placeholder : undefined}
          isRequired={isRequired}
          orientation={type === "checkbox" ? "horizontal" : "vertical"}
        >
          {(field) =>
            type === "checkbox" ? (
              <Checkbox
                id={currentField}
                checked={field.value}
                onCheckedChange={(checked) => {
                  return checked ? field.onChange(true) : field.onChange(false);
                }}
              />
            ) : (
              <Input type={type} placeholder={placeholder} {...field} />
            )
          }
        </FormFieldWrapper>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 border-t pt-4">{renderProviderFields()}</div>
    </div>
  );
}
