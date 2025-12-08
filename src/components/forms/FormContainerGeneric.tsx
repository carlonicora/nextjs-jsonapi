"use client";

import { ReactElement } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../shadcnui";

export function FormContainerGeneric({
  form,
  id,
  name,
  children,
  isRequired = false,
}: {
  form: any;
  id: string;
  name?: string;
  children: ReactElement<any>;
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
              <FormLabel className="flex items-center">
                <span>{name}</span>
                {isRequired && <span className="text-destructive ml-2 font-semibold">*</span>}
              </FormLabel>
            )}
            <FormControl>{children}</FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
