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
  description,
  isRequired,
  textareaRef,
}: {
  form: any;
  id: string;
  name: string;
  placeholder?: string;
  className?: string;
  testId?: string;
  description?: string;
  isRequired?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper
        form={form}
        name={id}
        label={name}
        description={description}
        isRequired={isRequired}
        testId={testId}
      >
        {(field) => (
          <Textarea
            {...field}
            ref={textareaRef}
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
