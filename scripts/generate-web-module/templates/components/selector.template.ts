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
  const { names, fields, extendsContent } = data;
  const hasNameField = extendsContent || fields.some((f) => f.name === "name");
  const i18nKey = names.pluralCamel.toLowerCase();
  const displayProp = hasNameField ? "name" : "id";

  return `"use client";

import {
  Command,
  CommandItem,
  CommandList,
  FormFieldWrapper,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@carlonicora/nextjs-jsonapi/components";
import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import { DataListRetriever, useDataListRetriever } from "@carlonicora/nextjs-jsonapi/client";
import { useDebounce } from "@carlonicora/nextjs-jsonapi/client";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

import { CircleX, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
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
      form.setValue(id, undefined, { shouldDirty: true });
      setOpen(false);
      return;
    }

    form.setValue(id, { id: ${names.camelCase}.id, name: ${names.camelCase}.${displayProp} }, { shouldDirty: true });
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
                <div className="flex w-full flex-row items-center justify-start rounded-md">
                  {field.value ? (
                    <div className="bg-input/20 dark:bg-input/30 border-input flex h-7 w-full flex-row items-center justify-start rounded-md border px-2 py-0.5 text-sm md:text-xs/relaxed">
                      <span>{field.value?.name ?? ""}</span>
                    </div>
                  ) : (
                    <div className="bg-input/20 dark:bg-input/30 border-input text-muted-foreground flex h-7 w-full flex-row items-center justify-start rounded-md border px-2 py-0.5 text-sm md:text-xs/relaxed">
                      {placeholder ?? t(\`generic.search.placeholder\`, { type: t(\`entities.${i18nKey}\`, { count: 1 }) })}
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              {field.value && (
                <CircleX
                  className="text-muted hover:text-destructive ml-2 h-4 w-4 shrink-0 cursor-pointer"
                  onClick={() => set${names.pascalCase}()}
                />
              )}
            </div>
            <PopoverContent align="start" className="w-(--anchor-width)">
              <Command shouldFilter={false}>
                <div className="relative mb-2 w-full">
                  <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                  <Input
                    placeholder={t(\`generic.search.placeholder\`, { type: t(\`entities.${i18nKey}\`, { count: 1 }) })}
                    type="text"
                    className="w-full pr-8 pl-8"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                  />
                  {isSearching ? (
                    <RefreshCwIcon className="text-muted-foreground absolute top-2.5 right-2.5 h-4 w-4 animate-spin" />
                  ) : searchTermRef.current ? (
                    <XIcon
                      className={\`absolute top-2.5 right-2.5 h-4 w-4 \${searchTermRef.current ? "cursor-pointer" : "text-muted-foreground"}\`}
                      onClick={() => {
                        setSearchTerm("");
                        search("");
                      }}
                    />
                  ) : (
                    <></>
                  )}
                </div>
                <CommandList>
                  {data.data &&
                    data.data.length > 0 &&
                    (data.data as ${names.pascalCase}Interface[]).map((${names.camelCase}: ${names.pascalCase}Interface) => (
                      <CommandItem
                        className="cursor-pointer hover:bg-muted data-selected:hover:bg-muted bg-transparent data-selected:bg-transparent"
                        key={${names.camelCase}.id}
                        onSelect={() => set${names.pascalCase}(${names.camelCase})}
                      >
                        {${names.camelCase}.${displayProp}}
                      </CommandItem>
                    ))}
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
