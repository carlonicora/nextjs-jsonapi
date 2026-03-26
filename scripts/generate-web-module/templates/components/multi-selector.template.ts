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
  const { names, fields, extendsContent } = data;
  const hasNameField = extendsContent || fields.some((f) => f.name === "name");
  const firstStringField = fields.find((f) => f.tsType === "string" || f.tsType === "string | null");
  const displayProp = hasNameField ? "name" : (firstStringField?.name ?? "id");

  return `"use client";

import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import { EntityMultiSelector } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { useTranslations } from "next-intl";

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
  isRequired = false,
}: ${names.pascalCase}MultiSelectorProps) {
  const t = useTranslations();

  return (
    <EntityMultiSelector<${names.pascalCase}Interface>
      id={id}
      form={form}
      label={label}
      placeholder={placeholder || t("ui.search.button")}
      emptyText={t("ui.search.no_results_generic")}
      isRequired={isRequired}
      retriever={(params) => ${names.pascalCase}Service.findMany(params)}
      module={Modules.${names.pascalCase}}
      getLabel={(${names.camelCase}) => ${displayProp === "id" ? `${names.camelCase}.id` : `${names.camelCase}.${displayProp}`}}
      excludeId={current${names.pascalCase}?.id}
      onChange={onChange}
    />
  );
}
`;
}
