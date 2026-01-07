"use client";

import { FieldLabel, Switch } from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormSwitch({ form, id, name, disabled }: { form: any; id: string; name?: string; disabled?: boolean }) {
  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper
        form={form}
        name={id}
        orientation="horizontal"
      >
        {(field) => (
          <div className="flex flex-row gap-x-4">
            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
            {name && <FieldLabel>{name}</FieldLabel>}
          </div>
        )}
      </FormFieldWrapper>
    </div>
  );
}
