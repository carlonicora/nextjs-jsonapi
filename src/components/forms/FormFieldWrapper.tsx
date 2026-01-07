"use client";

import { ReactNode } from "react";
import {
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "../../shadcnui";

type FormFieldWrapperProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  isRequired?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
  children: (field: ControllerRenderProps<T, Path<T>>, fieldState: ControllerFieldState) => ReactNode;
  testId?: string;
};

export function FormFieldWrapper<T extends FieldValues>({
  form,
  name,
  label,
  description,
  isRequired,
  orientation = "vertical",
  children,
  testId,
}: FormFieldWrapperProps<T>) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation={orientation} data-invalid={!!fieldState.error} data-testid={testId}>
          {label && (
            <FieldLabel>
              {label}
              {isRequired && <span className="text-destructive ml-1 font-semibold">*</span>}
            </FieldLabel>
          )}
          {children(field, fieldState)}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </Field>
      )}
    />
  );
}
