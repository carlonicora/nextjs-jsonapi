"use client";

import { HowToInterface } from "@/features/essentials/how-to/data/HowToInterface";
import { HowToService } from "@/features/essentials/how-to/data/HowToService";
import { DataListRetriever, useDataListRetriever, useDebounce } from "@carlonicora/nextjs-jsonapi/client";
import { FormFieldWrapper, MultipleSelector } from "@carlonicora/nextjs-jsonapi/components";
import { Option } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useWatch } from "react-hook-form";

type HowToMultiSelectType = {
  id: string;
  name: string;
};

type HowToMultiSelectorProps = {
  id: string;
  form: any;
  currentHowTo?: HowToInterface;
  label?: string;
  placeholder?: string;
  onChange?: (howTos?: HowToInterface[]) => void;
  maxCount?: number;
  isRequired?: boolean;
};

type HowToOption = Option & {
  howToData?: HowToInterface;
};

export default function HowToMultiSelector({
  id,
  form,
  currentHowTo,
  label,
  placeholder,
  onChange,
  maxCount = 3,
  isRequired = false,
}: HowToMultiSelectorProps) {
  const t = useTranslations();
  const [howToOptions, setHowToOptions] = useState<HowToOption[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const selectedHowTos: HowToMultiSelectType[] = useWatch({ control: form.control, name: id }) || [];

  const data: DataListRetriever<HowToInterface> = useDataListRetriever({
    retriever: (params) => HowToService.findMany(params),
    retrieverParams: {},
    ready: true,
    module: Modules.HowTo,
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
      const howTos = data.data as HowToInterface[];
      const filteredHowTos = howTos.filter((howTo) => howTo.id !== currentHowTo?.id);

      const options: HowToOption[] = filteredHowTos.map((howTo) => ({
        label: howTo.name,
        value: howTo.id,
        howToData: howTo,
      }));

      // Add options for any already selected that aren't in search results
      const existingOptionIds = new Set(options.map((option) => option.value));
      const missingOptions: HowToOption[] = selectedHowTos
        .filter((howTo) => !existingOptionIds.has(howTo.id))
        .map((howTo) => ({
          label: howTo.name,
          value: howTo.id,
          howToData: howTo as unknown as HowToInterface,
        }));

      setHowToOptions([...options, ...missingOptions]);
    }
  }, [data.data, currentHowTo, selectedHowTos]);

  // Convert selected to Option[] format
  const selectedOptions = useMemo(() => {
    return selectedHowTos.map((howTo) => ({
      value: howTo.id,
      label: howTo.name,
    }));
  }, [selectedHowTos]);

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
          const howToOption = howToOptions.find((opt) => opt.value === option.value);
          return howToOption?.howToData;
        })
        .filter(Boolean) as HowToInterface[];
      onChange(fullData);
    }
  };

  // Search handler
  const handleSearchSync = (search: string): Option[] => {
    setSearchTerm(search);
    return howToOptions;
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={label} isRequired={isRequired}>
        {() => (
          <MultipleSelector
            value={selectedOptions}
            onChange={handleChange}
            options={howToOptions}
            placeholder={placeholder}
            maxDisplayCount={maxCount}
            hideClearAllButton
            onSearchSync={handleSearchSync}
            delay={0}
            emptyIndicator={<span className="text-muted-foreground">{t("ui.search.no_results_generic")}</span>}
          />
        )}
      </FormFieldWrapper>
    </div>
  );
}
