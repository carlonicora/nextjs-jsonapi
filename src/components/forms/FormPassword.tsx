"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../shadcnui";
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
      <FormField
        control={form.control}
        name={id}
        render={({ field }) => (
          <FormItem className={`${name ? "mb-5" : "mb-1"}`}>
            {name && (
              <FormLabel>
                {name}
                {isRequired && <span className="text-destructive ml-2 font-semibold">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <PasswordInput
                {...field}
                className={`w-full`}
                disabled={disabled === true || form.formState.isSubmitting}
                placeholder={placeholder ? placeholder : ""}
                onBlur={onBlur}
                data-testid={testId}
              />
            </FormControl>
            <FormMessage data-testid={testId ? `${testId}-error` : undefined} />
          </FormItem>
        )}
      />
    </div>
  );
}
