"use client";

import { FieldDescription, FieldLabel, Switch } from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormSwitch({
  form,
  id,
  name,
  disabled,
  description,
}: {
  form: any;
  id: string;
  name?: string;
  disabled?: boolean;
  description?: string;
}) {
  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} orientation="horizontal">
        {(field) => (
          <div className="flex flex-row gap-x-4">
            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
            {name && <FieldLabel>{name}</FieldLabel>}
          </div>
        )}
      </FormFieldWrapper>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Switch id={id} />
    </div>
  );
}
