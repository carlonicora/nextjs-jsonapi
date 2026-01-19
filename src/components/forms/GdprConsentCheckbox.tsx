"use client";

import { ReactNode } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Checkbox, FieldDescription } from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

interface GdprConsentCheckboxProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  id: Path<T>;
  label: ReactNode;
  description?: string;
  required?: boolean;
}

export function GdprConsentCheckbox<T extends FieldValues>({
  form,
  id,
  label,
  description,
  required,
}: GdprConsentCheckboxProps<T>) {
  return (
    <FormFieldWrapper form={form} name={id} orientation="horizontal">
      {(field) => (
        <div className="flex flex-row items-start space-x-3 space-y-0">
          <Checkbox checked={field.value} onCheckedChange={field.onChange} aria-required={required} />
          <div className="space-y-1 leading-none">
            <span className="text-sm font-normal">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </span>
            {description && <FieldDescription className="text-xs">{description}</FieldDescription>}
          </div>
        </div>
      )}
    </FormFieldWrapper>
  );
}
