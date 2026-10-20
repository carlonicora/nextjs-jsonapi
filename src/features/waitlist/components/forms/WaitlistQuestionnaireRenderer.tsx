"use client";

import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from "../../../../components";
import { QuestionnaireField, useWaitlistText } from "../../config/waitlist.config";

interface WaitlistQuestionnaireRendererProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  fields: QuestionnaireField[];
  fieldPrefix?: string;
}

export function WaitlistQuestionnaireRenderer<T extends FieldValues>({
  form,
  fields,
  fieldPrefix = "questionnaire",
}: WaitlistQuestionnaireRendererProps<T>) {
  const text = useWaitlistText();

  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const fieldId = `${fieldPrefix}.${field.id}` as Path<T>;

        switch (field.type) {
          case "text":
            return (
              <FormInput
                key={field.id}
                form={form}
                id={fieldId}
                name={text(field.label) ?? field.label}
                placeholder={text(field.placeholder)}
                isRequired={field.required}
              />
            );

          case "textarea":
            return (
              <FormTextarea
                key={field.id}
                form={form}
                id={fieldId}
                name={text(field.label) ?? field.label}
                placeholder={text(field.placeholder)}
                className="min-h-24"
              />
            );

          case "select":
            if (!field.options || field.options.length === 0) {
              return null;
            }
            return (
              <FormSelect
                key={field.id}
                form={form}
                id={fieldId}
                name={text(field.label) ?? field.label}
                values={field.options.map((opt) => ({
                  id: opt.value,
                  text: text(opt.label) ?? opt.label,
                }))}
              />
            );

          case "checkbox":
            if (!field.options || field.options.length === 0) {
              return (
                <FormCheckbox
                  key={field.id}
                  form={form}
                  id={fieldId}
                  name={text(field.label) ?? field.label}
                  description={text(field.description)}
                  isRequired={field.required}
                />
              );
            }
            // Multiple checkboxes for options
            return (
              <div key={field.id} className="space-y-2">
                <span className="text-sm font-medium">
                  {text(field.label) ?? field.label}
                  {field.required && <span className="ms-1 text-destructive">*</span>}
                </span>
                {field.description && <p className="text-muted-foreground text-xs">{text(field.description)}</p>}
                <div className="space-y-2">
                  {field.options.map((option) => (
                    <FormCheckbox
                      key={option.value}
                      form={form}
                      id={`${fieldId}.${option.value}` as Path<T>}
                      name={text(option.label) ?? option.label}
                      description={text(option.description)}
                    />
                  ))}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
