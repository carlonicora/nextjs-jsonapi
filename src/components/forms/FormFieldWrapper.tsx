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
  className?: string;
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
  className,
  children,
  testId,
}: FormFieldWrapperProps<T>) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation={orientation} className={className} data-invalid={!!fieldState.error} data-testid={testId}>
          {label && (
            <FieldLabel>
              {label}
              {isRequired && <span className="ml-1 text-destructive">*</span>}
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
