"use client";

import { FormFieldWrapper } from "./FormFieldWrapper";
import { PasswordInput } from "./PasswordInput";

export function FormPassword({
  form,
  id,
  name,
  placeholder,
  onBlur,
  disabled,
  testId,
  isRequired,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  onBlur?: () => Promise<void>;
  disabled?: boolean;
  testId?: string;
  isRequired?: boolean;
}) {
  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={name} isRequired={isRequired} testId={testId}>
        {(field) => (
          <PasswordInput
            {...field}
            className="w-full"
            disabled={disabled === true || form.formState.isSubmitting}
            placeholder={placeholder ? placeholder : ""}
            onBlur={onBlur}
            data-testid={testId}
          />
        )}
      </FormFieldWrapper>
    </div>
  );
}
