/**
 * Selector Template
 *
 * Generates {Module}Selector.tsx searchable combobox component.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the selector component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateSelectorTemplate(data: FrontendTemplateData): string {
  const { names } = data;

  return `"use client";

import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  FormFieldWrapper,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@carlonicora/nextjs-jsonapi/components";
import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import { DataListRetriever, useDataListRetriever } from "@carlonicora/nextjs-jsonapi/client";
import { useDebounce } from "@carlonicora/nextjs-jsonapi/client";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

import { ChevronsUpDown, Loader2, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

type ${names.pascalCase}SelectorProps = {
  id: string;
  form: any;
  label?: string;
  placeholder?: string;
  onChange?: (${names.camelCase}?: ${names.pascalCase}Interface) => void;
  isRequired?: boolean;
};

export default function ${names.pascalCase}Selector({
  id,
  form,
  label,
  placeholder,
  onChange,
  isRequired = false,
}: ${names.pascalCase}SelectorProps) {
  const t = useTranslations();

  const [open, setOpen] = useState<boolean>(false);

  const searchTermRef = useRef<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isSearching, setIsSearching] = useState<boolean>(false);

  const data: DataListRetriever<${names.pascalCase}Interface> = useDataListRetriever({
    retriever: (params) => {
      return ${names.pascalCase}Service.findMany(params);
    },
    retrieverParams: {},
    module: Modules.${names.pascalCase},
  });

  const search = useCallback(
    async (searchedTerm: string) => {
      try {
        if (searchedTerm === searchTermRef.current) return;
        setIsSearching(true);
        searchTermRef.current = searchedTerm;
        await data.search(searchedTerm);
      } finally {
        setIsSearching(false);
      }
    },
    [searchTermRef, data],
  );

  const updateSearchTerm = useDebounce(search, 500);

  useEffect(() => {
    setIsSearching(true);
    updateSearchTerm(searchTerm);
  }, [updateSearchTerm, searchTerm]);

  const set${names.pascalCase} = (${names.camelCase}?: ${names.pascalCase}Interface) => {
    if (onChange) onChange(${names.camelCase});
    if (!${names.camelCase}) {
      form.setValue(id, undefined);
      setOpen(false);
      return;
    }

    form.setValue(id, { id: ${names.camelCase}.id, name: ${names.camelCase}.name });
    setOpen(false);

    setTimeout(() => {
      setOpen(false);
    }, 0);
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={label} isRequired={isRequired}>
        {(field) => (
          <Popover open={open} onOpenChange={setOpen} modal={true}>
            <div className="flex w-full flex-row items-center justify-between">
              <PopoverTrigger className="w-full">
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="h-auto min-h-10 w-full justify-between px-3 py-2"
                >
                  <span className={field.value ? "" : "text-muted-foreground"}>
                    {field.value?.name ?? placeholder ?? t(\`generic.search.placeholder\`, { type: t(\`types.${names.pluralKebab}\`, { count: 1 }) })}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              {field.value && (
                <XIcon
                  className="text-muted-foreground hover:text-destructive ml-2 h-5 w-5 cursor-pointer"
                  onClick={() => set${names.pascalCase}()}
                />
              )}
            </div>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={t(\`generic.search.placeholder\`, { type: t(\`types.${names.pluralKebab}\`, { count: 1 }) })}
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  {isSearching && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {!isSearching && data.data && data.data.length === 0 && (
                    <CommandEmpty>{t(\`generic.search.no_results\`)}</CommandEmpty>
                  )}
                  {!isSearching && data.data && data.data.length > 0 && (
                    <CommandGroup>
                      {(data.data as ${names.pascalCase}Interface[]).map((${names.camelCase}: ${names.pascalCase}Interface) => (
                        <CommandItem
                          key={${names.camelCase}.id}
                          value={${names.camelCase}.id}
                          onSelect={() => set${names.pascalCase}(${names.camelCase})}
                          className="hover:bg-muted data-selected:hover:bg-muted bg-transparent data-selected:bg-transparent cursor-pointer"
                        >
                          {${names.camelCase}.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </FormFieldWrapper>
    </div>
  );
}
`;
}
