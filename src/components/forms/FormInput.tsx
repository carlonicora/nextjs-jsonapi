"use client";

import { useTranslations } from "next-intl";
import React from "react";
import { Input, InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormInput({
  form,
  id,
  name,
  placeholder,
  type,
  onBlur,
  disabled,
  onKeyDown,
  autoFocus,
  onChange,
  testId,
  isRequired = false,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  type?: "text" | "number" | "currency" | "password" | "link";
  onBlur?: () => Promise<void>;
  disabled?: boolean;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  onChange?: (value: string | number) => Promise<void>;
  testId?: string;
  isRequired?: boolean;
}) {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={name} isRequired={isRequired}>
        {(field) => {
          const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
            let value = e.target.value;

            if (type === "link" && value) {
              if (!/^https?:\/\//i.test(value)) {
                value = "https://" + value;
                field.onChange(value);
              }
              try {
                new URL(value);
                form.clearErrors(id);
              } catch (error) {
                form.setError(id, {
                  type: "validate",
                  message: t(`common.errors.valid_url`),
                });
              }
            }

            if (onBlur) await onBlur();
            field.onBlur();
          };

          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (type === "number" || type === "currency") {
              const value = e.target.value.replace(/[^0-9]/g, "");
              field.onChange(+value);
              if (onChange) onChange(+value);
            } else {
              field.onChange(e.target.value);
              if (onChange) onChange(e.target.value);
            }
          };

          const inputProps = {
            ...field,
            autoFocus: autoFocus === true,
            type: type === "number" || type === "currency" ? "number" : type === "password" ? "password" : "text",
            className: `w-full ${type === "number" || type === "currency" ? "text-end" : ""}`,
            disabled: disabled === true || form.formState.isSubmitting,
            placeholder: placeholder || "",
            onBlur: handleBlur,
            onKeyDown,
            onChange: handleChange,
            "data-testid": testId,
          };

          // Use InputGroup for currency type to show Euro symbol
          if (type === "currency") {
            return (
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{"\u20AC"}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput {...inputProps} />
              </InputGroup>
            );
          }

          // Regular input for other types
          return <Input {...inputProps} />;
        }}
      </FormFieldWrapper>
    </div>
  );
}
