"use client";

import { Checkbox, FieldLabel, Tooltip, TooltipContent, TooltipTrigger } from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

type FormCheckboxProps = {
  form: any;
  id: string;
  name: string;
  labelBefore?: boolean;
  description?: string;
  isRequired?: boolean;
};

export function FormCheckbox({ form, id, name, labelBefore, description, isRequired }: FormCheckboxProps) {
  const simpleLabel = () => {
    return (
      <FieldLabel htmlFor={id} className={`font-normal ${labelBefore ? "" : "ml-3"}`}>
        {name}
      </FieldLabel>
    );
  };

  const label = () => {
    if (!description) return simpleLabel();
    else
      return (
        <Tooltip>
          <TooltipTrigger>{simpleLabel()}</TooltipTrigger>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip>
      );
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} orientation="horizontal">
        {(field) => (
          <div className="flex gap-x-4">
            {labelBefore && label()}
            {labelBefore && isRequired && <span className="text-destructive ml-2 font-semibold">*</span>}
            <Checkbox id={id} defaultChecked={field.value} onCheckedChange={field.onChange} />
            {!labelBefore && label()}
            {!labelBefore && isRequired && <span className="text-destructive ml-2 font-semibold">*</span>}
          </div>
        )}
      </FormFieldWrapper>
    </div>
  );
}
