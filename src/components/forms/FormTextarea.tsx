"use client";

import { Textarea } from "../../shadcnui";
import { cn } from "../../utils";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormTextarea({
  form,
  id,
  name,
  className,
  placeholder,
  testId,
}: {
  form: any;
  id: string;
  name: string;
  placeholder?: string;
  className?: string;
  testId?: string;
}) {
  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={name} testId={testId}>
        {(field) => (
          <Textarea
            {...field}
            className={cn("min-h-96 w-full", className)}
            disabled={form.formState.isSubmitting}
            placeholder={placeholder}
            data-testid={testId}
          />
        )}
      </FormFieldWrapper>
    </div>
  );
}
