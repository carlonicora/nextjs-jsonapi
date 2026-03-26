"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import { Badge } from "../../shadcnui/ui/badge";
import { Input } from "../../shadcnui/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../shadcnui/ui/popover";
import { FormFieldWrapper } from "./FormFieldWrapper";
import { type DataListRetriever, useDataListRetriever } from "../../hooks/useDataListRetriever";
import { useDebounce } from "../../hooks/useDebounce";

type EntityMultiSelectorProps<T extends { id: string }> = {
  id: string;
  form: any;
  label?: string;
  placeholder?: string;
  emptyText?: string;
  isRequired?: boolean;
  retriever: (params: any) => Promise<T[]>;
  retrieverParams?: Record<string, any>;
  module: any;
  getLabel: (entity: T) => string;
  toFormValue?: (entity: T) => { id: string; [key: string]: any };
  getFormValueLabel?: (formValue: any) => string;
  excludeId?: string;
  onChange?: (entities?: T[]) => void;
  renderOption?: (entity: T, isSelected: boolean) => ReactNode;
};

type OptionData<T> = {
  id: string;
  label: string;
  entityData?: T;
};

const defaultFormValueLabel = (v: any) => v.name ?? v.id;

export function EntityMultiSelector<T extends { id: string }>({
  id,
  form,
  label,
  placeholder = "Search...",
  emptyText = "No results found.",
  isRequired = false,
  retriever,
  retrieverParams = {},
  module,
  getLabel,
  toFormValue,
  getFormValueLabel,
  excludeId,
  onChange,
  renderOption,
}: EntityMultiSelectorProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<OptionData<T>[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Stabilize callback props in refs to prevent infinite re-render loops.
  // These functions are passed inline by consumers (e.g. getLabel={(w) => w.name})
  // which creates new references every render. Using refs keeps effects stable.
  const getLabelRef = useRef(getLabel);
  const toFormValueRef = useRef(toFormValue);
  const getFormValueLabelRef = useRef(getFormValueLabel);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    getLabelRef.current = getLabel;
  }, [getLabel]);
  useEffect(() => {
    toFormValueRef.current = toFormValue;
  }, [toFormValue]);
  useEffect(() => {
    getFormValueLabelRef.current = getFormValueLabel;
  }, [getFormValueLabel]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const stableGetFormValueLabel = useCallback((v: any) => {
    const fn = getFormValueLabelRef.current;
    return fn ? fn(v) : defaultFormValueLabel(v);
  }, []);

  const stableToFormValue = useCallback((entity: T) => {
    const fn = toFormValueRef.current;
    return fn ? fn(entity) : { id: entity.id, name: getLabelRef.current(entity) };
  }, []);

  const selectedValues: { id: string; [key: string]: any }[] = useWatch({ control: form.control, name: id }) || [];
  const selectedIds = useMemo(() => new Set(selectedValues.map((v) => v.id)), [selectedValues]);

  const data: DataListRetriever<T> = useDataListRetriever({
    retriever: (params) => retriever(params),
    retrieverParams,
    ready: true,
    module,
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
    if (data.data) {
      const entities = data.data as T[];
      const filtered = excludeId ? entities.filter((e) => e.id !== excludeId) : entities;

      const entityOptions: OptionData<T>[] = filtered.map((entity) => ({
        id: entity.id,
        label: getLabelRef.current(entity),
        entityData: entity,
      }));

      const existingIds = new Set(entityOptions.map((o) => o.id));
      const missingOptions: OptionData<T>[] = selectedValues
        .filter((v) => !existingIds.has(v.id))
        .map((v) => ({
          id: v.id,
          label: stableGetFormValueLabel(v),
          entityData: v as unknown as T,
        }));

      setOptions([...entityOptions, ...missingOptions]);
    }
  }, [data.data, excludeId, selectedValues, stableGetFormValueLabel]);

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [open]);

  const toggleEntity = useCallback(
    (option: OptionData<T>) => {
      const current: any[] = form.getValues(id) ?? [];
      let next: any[];

      if (selectedIds.has(option.id)) {
        next = current.filter((v: any) => v.id !== option.id);
      } else {
        const formValue = option.entityData
          ? stableToFormValue(option.entityData)
          : { id: option.id, name: option.label };
        next = [...current, formValue];
      }

      form.setValue(id, next, { shouldDirty: true, shouldTouch: true });

      const cb = onChangeRef.current;
      if (cb) {
        const fullData = next
          .map((v: any) => options.find((opt) => opt.id === v.id)?.entityData)
          .filter(Boolean) as T[];
        cb(fullData);
      }
    },
    [form, id, selectedIds, options, stableToFormValue],
  );

  const removeEntity = useCallback(
    (entityId: string) => {
      const current: any[] = form.getValues(id) ?? [];
      const next = current.filter((v: any) => v.id !== entityId);
      form.setValue(id, next, { shouldDirty: true, shouldTouch: true });

      const cb = onChangeRef.current;
      if (cb) {
        const fullData = next
          .map((v: any) => options.find((opt) => opt.id === v.id)?.entityData)
          .filter(Boolean) as T[];
        cb(fullData);
      }
    },
    [form, id, options],
  );

  const sortedOptions = useMemo(() => {
    const filtered = searchTerm.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      : options;

    return [...filtered].sort((a, b) => {
      const aSelected = selectedIds.has(a.id) ? 0 : 1;
      const bSelected = selectedIds.has(b.id) ? 0 : 1;
      return aSelected - bSelected;
    });
  }, [options, selectedIds, searchTerm]);

  const triggerSummary = useMemo(() => {
    if (selectedValues.length === 0) return null;
    return selectedValues.map((v) => stableGetFormValueLabel(v)).join(", ");
  }, [selectedValues, stableGetFormValueLabel]);

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={label} isRequired={isRequired}>
        {() => (
          <div className="flex flex-col gap-2">
            <Popover open={open} onOpenChange={setOpen} modal>
              <PopoverTrigger className="w-full">
                <div className="bg-input/20 dark:bg-input/30 border-input flex min-h-7 w-full items-center gap-2 rounded-md border px-2 text-sm md:text-xs/relaxed">
                  {selectedValues.length > 0 ? (
                    <>
                      <span className="text-foreground min-w-0 flex-1 truncate text-left">{triggerSummary}</span>
                      <span className="bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium">
                        {selectedValues.length}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground flex-1 text-left">{placeholder}</span>
                  )}
                  <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-(--anchor-width) flex flex-col gap-0 p-0" align="start">
                <div className="relative p-1.5">
                  <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2" />
                  <Input
                    ref={searchInputRef}
                    placeholder={placeholder}
                    type="text"
                    className="h-8 w-full pr-7 pl-7 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2"
                      onClick={() => setSearchTerm("")}
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto p-1">
                  {sortedOptions.length === 0 ? (
                    <div className="text-muted-foreground py-4 text-center text-xs">{emptyText}</div>
                  ) : (
                    sortedOptions.map((option) => {
                      const isSelected = selectedIds.has(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className="hover:bg-muted flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs/relaxed"
                          onClick={() => toggleEntity(option)}
                        >
                          {renderOption && option.entityData ? (
                            <>
                              <div
                                className={`border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                                  isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                }`}
                              >
                                {isSelected && <CheckIcon className="size-3" />}
                              </div>
                              {renderOption(option.entityData, isSelected)}
                            </>
                          ) : (
                            <>
                              <div
                                className={`border-primary flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                                  isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                }`}
                              >
                                {isSelected && <CheckIcon className="size-3" />}
                              </div>
                              <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>
                                {option.label}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedValues.map((value) => (
                  <Badge
                    key={value.id}
                    variant="outline"
                    className="h-auto gap-1.5 rounded-md px-2.5 py-1 pr-1.5 text-xs"
                  >
                    {stableGetFormValueLabel(value)}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground rounded-sm p-0.5 transition-colors"
                      onClick={() => removeEntity(value.id)}
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </FormFieldWrapper>
    </div>
  );
}
