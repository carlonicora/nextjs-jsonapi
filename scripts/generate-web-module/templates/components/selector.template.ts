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
  Command,
  CommandItem,
  CommandList,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@carlonicora/nextjs-jsonapi/components";
import { ${names.pascalCase}Interface } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
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
              <Popover open={open} onOpenChange={setOpen} modal={true}>
                <div className="flex w-full flex-row items-center justify-between">
                  <PopoverTrigger className="w-full">
                    <div className="flex w-full flex-row items-center justify-start rounded-md text-sm">
                      {field.value ? (
                        <>
                          <div className="flex w-full flex-row items-center justify-start rounded-md border p-2">
                            <span className="">{field.value?.name ?? ""}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground mr-7 flex h-10 w-full flex-row items-center justify-start rounded-md border p-2 text-sm">
                          {placeholder ?? t(\`generic.search.placeholder\`, { type: t(\`types.${names.pluralKebab}\`, { count: 1 }) })}
                        </div>
                      )}
                    </div>
                  </PopoverTrigger>
                  {field.value && (
                    <CircleX
                      className="text-muted hover:text-destructive ml-2 h-6 w-6 cursor-pointer"
                      onClick={() => set${names.pascalCase}()}
                    />
                  )}
                </div>
                <PopoverContent>
                  <Command shouldFilter={false}>
                    <div className="relative mb-2 w-full">
                      <SearchIcon className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                      <Input
                        placeholder={t(\`generic.search.placeholder\`, { type: t(\`types.${names.pluralKebab}\`, { count: 1 }) })}
                        type="text"
                        className="w-full pl-8 pr-8"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                      />
                      {isSearching ? (
                        <RefreshCwIcon className="text-muted-foreground absolute right-2.5 top-2.5 h-4 w-4 animate-spin" />
                      ) : searchTermRef.current ? (
                        <XIcon
                          className={\`absolute right-2.5 top-2.5 h-4 w-4 \${searchTermRef.current ? "cursor-pointer" : "text-muted-foreground"}\`}
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
                          <CommandItem className="cursor-pointer" key={${names.camelCase}.id} onSelect={() => set${names.pascalCase}(${names.camelCase})}>
                            <span className="">{${names.camelCase}.name}</span>
                          </CommandItem>
                        ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
