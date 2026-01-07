"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

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
}) {
  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper
        form={form}
        name={id}
        label={name}
        orientation={useRows ? "horizontal" : "vertical"}
        testId={testId}
      >
        {(field) => (
          <Select
            onValueChange={(e) => {
              field.onChange(e);
              if (onChange) onChange(e);
            }}
            defaultValue={field.value}
            data-testid={testId}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
