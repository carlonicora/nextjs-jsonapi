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

import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import { DataListRetriever, useDataListRetriever, useDebounce } from "@carlonicora/nextjs-jsonapi/client";
import { FormFieldWrapper, MultipleSelector } from "@carlonicora/nextjs-jsonapi/components";
import { Option } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type ${names.pascalCase}Option = Option & {
  ${names.camelCase}Data?: ${names.pascalCase}Interface;
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
  const [${names.camelCase}Options, set${names.pascalCase}Options] = useState<${names.pascalCase}Option[]>([]);
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
    [data]
  );

  const debouncedUpdateSearch = useDebounce(updateSearch, 500);

  useEffect(() => {
    debouncedUpdateSearch(searchTerm);
  }, [debouncedUpdateSearch, searchTerm]);

  useEffect(() => {
    if (data.data && data.data.length > 0) {
      const ${names.pluralCamel} = data.data as ${names.pascalCase}Interface[];
      const filtered${names.pluralPascal} = ${names.pluralCamel}.filter((${names.camelCase}) => ${names.camelCase}.id !== current${names.pascalCase}?.id);

      const options: ${names.pascalCase}Option[] = filtered${names.pluralPascal}.map((${names.camelCase}) => ({
        label: ${names.camelCase}.name,
        value: ${names.camelCase}.id,
        ${names.camelCase}Data: ${names.camelCase},
      }));

      // Add options for any already selected that aren't in search results
      const existingOptionIds = new Set(options.map((option) => option.value));
      const missingOptions: ${names.pascalCase}Option[] = selected${names.pluralPascal}
        .filter((${names.camelCase}) => !existingOptionIds.has(${names.camelCase}.id))
        .map((${names.camelCase}) => ({
          label: ${names.camelCase}.name,
          value: ${names.camelCase}.id,
          ${names.camelCase}Data: ${names.camelCase} as unknown as ${names.pascalCase}Interface,
        }));

      set${names.pascalCase}Options([...options, ...missingOptions]);
    }
  }, [data.data, current${names.pascalCase}, selected${names.pluralPascal}]);

  // Convert selected to Option[] format
  const selectedOptions = useMemo(() => {
    return selected${names.pluralPascal}.map((${names.camelCase}) => ({
      value: ${names.camelCase}.id,
      label: ${names.camelCase}.name,
    }));
  }, [selected${names.pluralPascal}]);

  const handleChange = (options: Option[]) => {
    // Convert to form format
    const formValues = options.map((option) => ({
      id: option.value,
      name: option.label,
    }));

    form.setValue(id, formValues, { shouldDirty: true, shouldTouch: true });

    if (onChange) {
      // Get full data for onChange callback
      const fullData = options
        .map((option) => {
          const ${names.camelCase}Option = ${names.camelCase}Options.find((opt) => opt.value === option.value);
          return ${names.camelCase}Option?.${names.camelCase}Data;
        })
        .filter(Boolean) as ${names.pascalCase}Interface[];
      onChange(fullData);
    }
  };

  // Search handler
  const handleSearchSync = (search: string): Option[] => {
    setSearchTerm(search);
    return ${names.camelCase}Options;
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={label} isRequired={isRequired}>
        {() => (
          <MultipleSelector
            value={selectedOptions}
            onChange={handleChange}
            options={${names.camelCase}Options}
            placeholder={placeholder}
            maxDisplayCount={maxCount}
            hideClearAllButton
            onSearchSync={handleSearchSync}
            delay={0}
            emptyIndicator={<span className="text-muted-foreground">No results found</span>}
          />
        )}
      </FormFieldWrapper>
    </div>
  );
}
`;
}
