"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { CircleX, Plus, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
import { Command, CommandItem, CommandList } from "../../shadcnui/ui/command";
import { Input } from "../../shadcnui/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../shadcnui/ui/popover";
import { FormFieldWrapper } from "./FormFieldWrapper";
import { type DataListRetriever, useDataListRetriever } from "../../hooks/useDataListRetriever";
import { useDebounce } from "../../hooks/useDebounce";

type BaseEntity = { id: string };

type EntitySelectorProps<T extends BaseEntity> = {
  id: string;
  form: any;
  module: any;
  retriever: (params: any) => Promise<T[]>;
  retrieverParams?: Record<string, any>;
  getLabel?: (entity: T) => string;
  label?: string;
  placeholder?: string;
  emptyText?: string;
  isRequired?: boolean;
  disabled?: boolean;
  description?: string;
  ready?: boolean;
  onChange?: (entity?: T) => void;
  onCreateNew?: (name: string) => Promise<T | undefined>;
  createNewLabel?: (searchTerm: string) => string;
  toFormValue?: (entity: T) => Record<string, any>;
  getSelectedItemDisplay?: (value: Record<string, any>) => ReactNode;
  renderOption?: (entity: T, onSelect: () => void) => ReactNode;
  filterData?: (data: T[]) => T[];
  renderAfter?: (props: { form: any; selectedEntity?: T }) => ReactNode;
  autoSelectSingle?: boolean;
  useFormWatch?: boolean;
};

export default function EntitySelector<T extends BaseEntity>({
  id,
  form,
  module,
  retriever,
  retrieverParams,
  ready = true,
  getLabel = (entity: T) => (entity as any).name,
  label,
  placeholder = "Search...",
  emptyText,
  isRequired = false,
  disabled = false,
  description,
  onChange,
  onCreateNew,
  createNewLabel,
  toFormValue = (entity: T) => ({ id: entity.id, name: (entity as any).name }),
  getSelectedItemDisplay,
  renderOption,
  filterData,
  renderAfter,
  autoSelectSingle = false,
  useFormWatch: shouldUseFormWatch = false,
}: EntitySelectorProps<T>) {
  const [open, setOpen] = useState<boolean>(false);
  const searchTermRef = useRef<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<T | undefined>(undefined);

  const watchedValue = shouldUseFormWatch ? form.watch(id) : undefined;

  const data: DataListRetriever<T> = useDataListRetriever<T>({
    retriever: (params) => retriever(params),
    retrieverParams: retrieverParams ?? {},
    ready,
    module,
  });

  useEffect(() => {
    if (ready) data.setReady(true);
  }, [ready]);

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

  useEffect(() => {
    if (
      autoSelectSingle &&
      data.isLoaded &&
      data.data &&
      data.data.length === 1 &&
      searchTerm === "" &&
      !form.getValues(id)
    ) {
      const entity = data.data[0];
      form.setValue(id, toFormValue(entity));
      setSelectedEntity(entity);
    }
  }, [data.isLoaded, data.data, searchTerm, form, id, autoSelectSingle, toFormValue]);

  const handleSelect = (entity?: T) => {
    setSelectedEntity(entity);
    if (onChange) onChange(entity);
    if (!entity) {
      form.setValue(id, undefined);
      setOpen(false);
      return;
    }
    form.setValue(id, toFormValue(entity));
    setOpen(false);
    setTimeout(() => setOpen(false), 0);
  };

  const handleCreateNew = async () => {
    if (!onCreateNew) return;
    const trimmed = searchTerm.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    try {
      const created = await onCreateNew(trimmed);
      if (created) {
        handleSelect(created);
        setSearchTerm("");
        searchTermRef.current = "";
      }
    } finally {
      setIsCreating(false);
    }
  };

  const displayData = filterData ? filterData((data.data as T[]) ?? []) : ((data.data as T[]) ?? []);

  const hasValue = (value: any) => {
    if (value == null) return false;
    if (typeof value === "object") return !!value.id;
    return !!value;
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={label} isRequired={isRequired} description={description}>
        {(field) => {
          const effectiveValue = shouldUseFormWatch ? watchedValue : field.value;
          return (
            <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen} modal={true}>
              <PopoverTrigger className="w-full" disabled={disabled}>
                <div
                  className={`bg-input/20 dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[2px] flex min-h-7 w-full items-center gap-2 rounded-md border px-2 py-0.5 text-sm md:text-xs/relaxed ${
                    hasValue(effectiveValue) ? "" : "text-muted-foreground"
                  } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <span className="min-w-0 flex-1 truncate text-left">
                    {hasValue(effectiveValue)
                      ? getSelectedItemDisplay
                        ? getSelectedItemDisplay(effectiveValue)
                        : (effectiveValue?.name ?? "")
                      : placeholder}
                  </span>
                  {hasValue(effectiveValue) && !disabled && (
                    <CircleX
                      className="text-muted hover:text-destructive ml-auto h-4 w-4 shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleSelect();
                      }}
                    />
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-(--anchor-width) pointer-events-auto">
                <Command shouldFilter={false}>
                  <div className="relative mb-2 w-full">
                    <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                    <Input
                      placeholder={placeholder}
                      type="text"
                      className="w-full pr-8 pl-8"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      value={searchTerm}
                    />
                    {isSearching ? (
                      <RefreshCwIcon className="text-muted-foreground absolute top-2.5 right-2.5 h-4 w-4 animate-spin" />
                    ) : searchTermRef.current ? (
                      <XIcon
                        className="absolute top-2.5 right-2.5 h-4 w-4 cursor-pointer"
                        onClick={() => {
                          setSearchTerm("");
                          search("");
                        }}
                      />
                    ) : null}
                  </div>
                  <CommandList>
                    {onCreateNew && (
                      <CommandItem
                        key="__create_new__"
                        value="__create_new__"
                        className={`cursor-pointer ${!searchTerm.trim() || isCreating ? "opacity-50 pointer-events-none" : ""}`}
                        disabled={!searchTerm.trim() || isCreating}
                        onSelect={handleCreateNew}
                      >
                        {isCreating ? (
                          <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        <span>{createNewLabel ? createNewLabel(searchTerm) : searchTerm.trim() || ""}</span>
                      </CommandItem>
                    )}
                    {renderOption
                      ? displayData.map((entity: T) => renderOption(entity, () => handleSelect(entity)))
                      : displayData.map((entity: T) => (
                          <CommandItem
                            className="cursor-pointer bg-transparent data-selected:bg-transparent hover:bg-muted data-selected:hover:bg-muted"
                            key={entity.id}
                            value={entity.id}
                            onSelect={() => handleSelect(entity)}
                          >
                            <span>{getLabel(entity)}</span>
                          </CommandItem>
                        ))}
                    {emptyText && displayData.length === 0 && !onCreateNew && (
                      <div className="text-muted-foreground py-6 text-center text-xs">{emptyText}</div>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          );
        }}
      </FormFieldWrapper>
      {renderAfter && renderAfter({ form, selectedEntity })}
    </div>
  );
}
