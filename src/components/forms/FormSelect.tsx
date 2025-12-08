"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcnui";

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
    <div className={`flex w-full flex-col`}>
      <FormField
        control={form.control}
        name={id}
        render={({ field }) => (
          <FormItem className={`flex w-full ${useRows ? `flex-row items-center justify-between gap-x-4` : `flex-col`}`}>
            {name && <FormLabel className={`${useRows ? `min-w-28` : ``}`}>{name}</FormLabel>}
            <Select
              onValueChange={(e) => {
                field.onChange(e);
                if (onChange) onChange(e);
              }}
              defaultValue={field.value}
              data-testid={testId}
            >
              <FormControl className="w-full">
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {values.map((type: { id: string; text: string }) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
