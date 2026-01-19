"use client";

import { useWatch } from "react-hook-form";
import { Slider } from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormSlider({
  form,
  id,
  name,
  disabled,
  showPercentage,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  showPercentage?: boolean;
}) {
  const value = useWatch({ control: form.control, name: id });

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={name}>
        {() => (
          <div>
            {showPercentage && (
              <div className="text-muted-foreground mb-2 flex w-full justify-center text-xs">{`${value}%`}</div>
            )}
            <Slider
              onValueChange={(val) => {
                const newValue = Array.isArray(val) ? val[0] : val;
                form.setValue(id, newValue);
              }}
              value={[value]}
              max={100}
              step={5}
              disabled={disabled === true || form.formState.isSubmitting}
            />
          </div>
        )}
      </FormFieldWrapper>
    </div>
  );
}
