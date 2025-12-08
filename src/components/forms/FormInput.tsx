"use client";

import { useTranslations } from "next-intl";
import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from "../../shadcnui";

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
      <FormField
        control={form.control}
        name={id}
        render={({ field }) => {
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
                  message: t(`generic.errors.valid_url`),
                });
              }
            }

            if (onBlur) await onBlur();
            field.onBlur();
          };

          return (
            <FormItem className={`${name ? "mb-5" : "mb-1"}`}>
              {name && (
                <FormLabel className="flex items-center">
                  {name}
                  {isRequired && <span className="text-destructive ml-2 font-semibold">*</span>}
                </FormLabel>
              )}
              <FormControl>
                <div className="relative">
                  {type === "currency" && (
                    <span className="text-muted-foreground absolute top-0 left-0 pt-2 pl-3">€</span>
                  )}
                  <Input
                    data-testid={testId}
                    {...field}
                    autoFocus={autoFocus === true}
                    type={
                      type === "number" || type === "currency" ? "number" : type === "password" ? "password" : "text"
                    }
                    className={`w-full ${type === "number" || type === "currency" ? "text-end" : ""}`}
                    disabled={disabled === true || form.formState.isSubmitting}
                    placeholder={placeholder || ""}
                    onBlur={handleBlur}
                    onKeyDown={onKeyDown}
                    onChange={(e) => {
                      if (type === "number" || type === "currency") {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(+value);
                        if (onChange) onChange(+value);
                      } else {
                        field.onChange(e.target.value);
                        if (onChange) onChange(e.target.value);
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage data-testid={testId ? `${testId}-error` : undefined} />
            </FormItem>
          );
        }}
      />
    </div>
  );
}
