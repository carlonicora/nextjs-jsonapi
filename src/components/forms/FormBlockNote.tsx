"use client";

import React from "react";
import { BlockNoteEditorContainer } from "../editors/BlockNoteEditorContainer";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormBlockNote({
  form,
  id,
  name,
  placeholder,
  type,
  isRequired = false,
  description,
  testId,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  type: string;
  isRequired?: boolean;
  description?: string;
  testId?: string;
}) {
  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper
        form={form}
        name={id}
        label={name}
        isRequired={isRequired}
        description={description}
        testId={testId}
      >
        {(field) => (
          <BlockNoteEditorContainer
            id={form.getValues("id")}
            type={type}
            initialContent={field.value}
            onChange={(content) => {
              field.onChange(content);
            }}
            placeholder={placeholder}
            bordered
          />
        )}
      </FormFieldWrapper>
    </div>
  );
}
