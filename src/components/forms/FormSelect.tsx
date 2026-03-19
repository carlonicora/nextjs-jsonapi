"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

const EMPTY_VALUE = "__empty__";

export function FormSelect({
  form,
  id,
  name,
  placeholder,
  disabled,
  values,
  onChange,
  useRows,
  testId,
  allowEmpty,
  isRequired,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  values: { id: string; text: string }[];
  onChange?: (value: string) => void;
  useRows?: boolean;
  testId?: string;
  allowEmpty?: boolean;
  isRequired?: boolean;
}) {
  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper
        form={form}
        name={id}
        label={name}
        isRequired={isRequired}
        orientation={useRows ? "horizontal" : "vertical"}
        testId={testId}
      >
        {(field) => (
          <Select
            onValueChange={(e) => {
              const actual = e === EMPTY_VALUE ? "" : e;
              field.onChange(actual);
              if (onChange) onChange(actual);
            }}
            value={field.value || (allowEmpty ? EMPTY_VALUE : field.value)}
            disabled={disabled}
            data-testid={testId}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {field.value ? values.find((v) => v.id === field.value)?.text : (placeholder ?? "")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allowEmpty && (
                <SelectItem value={EMPTY_VALUE} className="text-muted-foreground">
                  {placeholder ?? ""}
                </SelectItem>
              )}
              {values.map((type: { id: string; text: string }) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormFieldWrapper>
    </div>
  );
}
