/**
 * MultiSelector Template
 *
 * Generates {Module}MultiSelector.tsx multi-select component.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the multi-selector component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateMultiSelectorTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage, MultiSelect } from "@carlonicora/nextjs-jsonapi/components";
import { ${names.pascalCase}Interface } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import { DataListRetriever, useDataListRetriever } from "@carlonicora/nextjs-jsonapi/client";
import { useDebounce } from "@carlonicora/nextjs-jsonapi/client";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

type ${names.pascalCase}MultiSelectType = {
  id: string;
  name: string;
};

type ${names.pascalCase}MultiSelectorProps = {
  id: string;
  form: any;
  current${names.pascalCase}?: ${names.pascalCase}Interface;
  label?: string;
  placeholder?: string;
  onChange?: (${names.pluralCamel}?: ${names.pascalCase}Interface[]) => void;
  maxCount?: number;
  isRequired?: boolean;
};

export default function ${names.pascalCase}MultiSelector({
  id,
  form,
  current${names.pascalCase},
  label,
  placeholder,
  onChange,
  maxCount = 3,
  isRequired = false,
}: ${names.pascalCase}MultiSelectorProps) {
  const t = useTranslations("features.${names.camelCase}");
  const [${names.camelCase}Options, set${names.pascalCase}Options] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const selected${names.pluralPascal}: ${names.pascalCase}MultiSelectType[] = useWatch({ control: form.control, name: id }) || [];

  const data: DataListRetriever<${names.pascalCase}Interface> = useDataListRetriever({
    retriever: (params) => ${names.pascalCase}Service.findMany(params),
    retrieverParams: {},
    ready: true,
    module: Modules.${names.pascalCase},
  });

  const updateSearch = useCallback(
    (searchedTerm: string) => {
      if (searchedTerm.trim()) {
        data.addAdditionalParameter("search", searchedTerm.trim());
      } else {
        data.removeAdditionalParameter("search");
      }
    },
    [data],
  );

  const debouncedUpdateSearch = useDebounce(updateSearch, 500);

  useEffect(() => {
    debouncedUpdateSearch(searchTerm);
  }, [debouncedUpdateSearch, searchTerm]);

  useEffect(() => {
    if (data.data && data.data.length > 0) {
      const ${names.pluralCamel} = data.data as ${names.pascalCase}Interface[];
      const filtered${names.pluralPascal} = ${names.pluralCamel}.filter((${names.camelCase}) => ${names.camelCase}.id !== current${names.pascalCase}?.id);

      const options = filtered${names.pluralPascal}.map((${names.camelCase}) => ({
        label: ${names.camelCase}.name,
        value: ${names.camelCase}.id,
        ${names.camelCase}Data: ${names.camelCase},
      }));

      set${names.pascalCase}Options(options);
    }
  }, [data.data, current${names.pascalCase}]);

  // Add options for any already selected ${names.pluralCamel} that aren't in search results
  useEffect(() => {
    if (selected${names.pluralPascal}.length > 0) {
      // Create a map of existing option IDs for quick lookup
      const existingOptionIds = new Set(${names.camelCase}Options.map((option) => option.value));

      // Find selected ${names.pluralCamel} that don't have an option yet
      const missingOptions = selected${names.pluralPascal}
        .filter((${names.camelCase}) => !existingOptionIds.has(${names.camelCase}.id))
        .map((${names.camelCase}) => ({
          label: ${names.camelCase}.name,
          value: ${names.camelCase}.id,
          ${names.camelCase}Data: ${names.camelCase},
        }));

      if (missingOptions.length > 0) {
        set${names.pascalCase}Options((prev) => [...prev, ...missingOptions]);
      }
    }
  }, [selected${names.pluralPascal}, ${names.camelCase}Options]);

  const handleValueChange = (selectedIds: string[]) => {
    const updatedSelected${names.pluralPascal} = selectedIds.map((id) => {
      const existing${names.pascalCase} = selected${names.pluralPascal}.find((${names.camelCase}) => ${names.camelCase}.id === id);
      if (existing${names.pascalCase}) {
        return existing${names.pascalCase};
      }

      const option = ${names.camelCase}Options.find((option) => option.value === id);
      if (option?.${names.camelCase}Data) {
        return {
          id: option.${names.camelCase}Data.id,
          name: option.${names.camelCase}Data.name,
        };
      }

      return { id, name: id };
    });

    form.setValue(id, updatedSelected${names.pluralPascal});

    if (onChange) {
      const fullSelected${names.pluralPascal} = selectedIds
        .map((id) => ${names.camelCase}Options.find((option) => option.value === id)?.${names.camelCase}Data)
        .filter(Boolean) as ${names.pascalCase}Interface[];
      onChange(fullSelected${names.pluralPascal});
    }
  };

  const selected${names.pascalCase}Ids = selected${names.pluralPascal}.map((${names.camelCase}: ${names.pascalCase}MultiSelectType) => ${names.camelCase}.id);

  return (
    <div className="flex w-full flex-col">
      <FormField
        control={form.control}
        name={id}
        render={({ field }) => (
          <FormItem className={\`\${label ? "mb-5" : "mb-1"}\`}>
            {label && (
              <FormLabel className="flex items-center">
                {label}
                {isRequired && <span className="text-destructive ml-2 font-semibold">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <MultiSelect
                options={${names.camelCase}Options}
                onValueChange={handleValueChange}
                defaultValue={selected${names.pascalCase}Ids}
                placeholder={placeholder}
                maxCount={maxCount}
                animation={0}
                onSearchChange={setSearchTerm}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
`;
}
