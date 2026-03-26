"use client";

import { useTranslations } from "next-intl";
import { EntityMultiSelector } from "../../../../components/forms/EntityMultiSelector";
import { Modules } from "../../../../core";
import { HowToInterface } from "../../data/HowToInterface";
import { HowToService } from "../../data/HowToService";

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

export default function HowToMultiSelector({
  id,
  form,
  currentHowTo,
  label,
  placeholder,
  onChange,
  isRequired = false,
}: HowToMultiSelectorProps) {
  const t = useTranslations();

  return (
    <EntityMultiSelector<HowToInterface>
      id={id}
      form={form}
      label={label}
      placeholder={placeholder || t("ui.search.button")}
      emptyText={t("ui.search.no_results_generic")}
      isRequired={isRequired}
      retriever={(params) => HowToService.findMany(params)}
      module={Modules.HowTo}
      getLabel={(howTo) => howTo.name}
      excludeId={currentHowTo?.id}
      onChange={onChange}
    />
  );
}
