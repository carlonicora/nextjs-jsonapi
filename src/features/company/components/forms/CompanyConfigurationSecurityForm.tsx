"use client";

import { useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import { Checkbox, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from "../../../../shadcnui";

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
  const t = useTranslations();

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
        <FormField
          key={currentField}
          control={form.control}
          name={currentField}
          render={({ field: formField }) =>
            type === "checkbox" ? (
              <FormItem className="flex items-start space-x-4">
                <FormControl>
                  <Checkbox
                    id={currentField}
                    checked={formField.value}
                    onCheckedChange={(checked) => {
                      return checked ? formField.onChange(true) : formField.onChange(false);
                    }}
                  />
                </FormControl>
                <div className="grid gap-2">
                  <FormLabel htmlFor={currentField}>
                    {label} {isRequired && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <p className="text-muted-foreground text-sm">{placeholder}</p>
                </div>
                <FormLabel></FormLabel>
                <FormMessage />
              </FormItem>
            ) : (
              <FormItem>
                <FormLabel>
                  {label} {isRequired && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input type={type} placeholder={placeholder} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }
        />
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 border-t pt-4">{renderProviderFields()}</div>
    </div>
  );
}
