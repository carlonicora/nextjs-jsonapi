"use client";

import { CircleX, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Command,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../shadcnui";
import { FormFieldWrapper } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever, useDebounce } from "../../../../hooks";
import { HowToInterface } from "../../data/HowToInterface";
import { HowToService } from "../../data/HowToService";

type HowToSelectorProps = {
  id: string;
  form: any;
  label?: string;
  placeholder?: string;
  onChange?: (howTo?: HowToInterface) => void;
  isRequired?: boolean;
};

export default function HowToSelector({
  id,
  form,
  label,
  placeholder,
  onChange,
  isRequired = false,
}: HowToSelectorProps) {
  const t = useTranslations();

  const [open, setOpen] = useState<boolean>(false);

  const searchTermRef = useRef<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isSearching, setIsSearching] = useState<boolean>(false);

  const data: DataListRetriever<HowToInterface> = useDataListRetriever({
    retriever: (params) => {
      return HowToService.findMany(params);
    },
    retrieverParams: {},
    module: Modules.HowTo,
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

  const setHowTo = (howTo?: HowToInterface) => {
    if (onChange) onChange(howTo);
    if (!howTo) {
      form.setValue(id, undefined, { shouldDirty: true });
      setOpen(false);
      return;
    }

    form.setValue(id, { id: howTo.id, name: howTo.name }, { shouldDirty: true });
    setOpen(false);

    setTimeout(() => {
      setOpen(false);
    }, 0);
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={label} isRequired={isRequired}>
        {(field: any) => (
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
                      {placeholder ?? t(`generic.search.placeholder`, { type: t(`entities.howtos`, { count: 1 }) })}
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              {field.value && (
                <CircleX
                  className="text-muted hover:text-destructive ml-2 h-4 w-4 shrink-0 cursor-pointer"
                  onClick={() => setHowTo()}
                />
              )}
            </div>
            <PopoverContent align="start" className="w-(--anchor-width)">
              <Command shouldFilter={false}>
                <div className="relative mb-2 w-full">
                  <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                  <Input
                    placeholder={t(`generic.search.placeholder`, { type: t(`entities.howtos`, { count: 1 }) })}
                    type="text"
                    className="w-full pr-8 pl-8"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                  />
                  {isSearching ? (
                    <RefreshCwIcon className="text-muted-foreground absolute top-2.5 right-2.5 h-4 w-4 animate-spin" />
                  ) : searchTermRef.current ? (
                    <XIcon
                      className={`absolute top-2.5 right-2.5 h-4 w-4 ${searchTermRef.current ? "cursor-pointer" : "text-muted-foreground"}`}
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
                    (data.data as HowToInterface[]).map((howTo: HowToInterface) => (
                      <CommandItem
                        className="cursor-pointer hover:bg-muted data-selected:hover:bg-muted bg-transparent data-selected:bg-transparent"
                        key={howTo.id}
                        onSelect={() => setHowTo(howTo)}
                      >
                        {howTo.name}
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
