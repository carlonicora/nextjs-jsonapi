"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage, Switch } from "../../shadcnui";

export function FormSwitch({ form, id, name, disabled }: { form: any; id: string; name?: string; disabled?: boolean }) {
  return (
    <div className="flex w-full flex-col">
      <FormField
        control={form.control}
        name={id}
        render={({ field }) => (
          <FormItem className={`${name ? "mb-5" : "mb-1"}`}>
            <FormControl>
              <div className="flex flex-row gap-x-4">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                {name && <FormLabel>{name}</FormLabel>}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
