/**
 * List Template
 *
 * Generates {Module}List.tsx component for displaying a list of items.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";
import { toCamelCase, pluralize } from "../../transformers/name-transformer";

/**
 * Generate the list component file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateListTemplate(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent, tableFieldNames } = data;

  // Build field list for the table - use name + first few fields + updatedAt
  const displayFields = buildDisplayFields(data);

  return `"use client";

import ${names.pascalCase}Editor from "@/features/${data.importTargetDir}/${names.kebabCase}/components/forms/${names.pascalCase}Editor";
import { ${names.pascalCase}Fields } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Fields";
import { ${names.pascalCase}Interface } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";
import { ${names.pascalCase}Service } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Service";
import "@/features/${data.importTargetDir}/${names.kebabCase}/hooks/use${names.pascalCase}TableStructure";
import { ContentListTable } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { DataListRetriever, useDataListRetriever } from "@carlonicora/nextjs-jsonapi/client";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

export default function ${names.pascalCase}List() {
  const t = useTranslations();

  const data: DataListRetriever<${names.pascalCase}Interface> = useDataListRetriever({
    module: Modules.${names.pascalCase},
    retriever: (params) => ${names.pascalCase}Service.findMany(params),
    retrieverParams: {},
  });

  const functions: ReactNode[] = [<${names.pascalCase}Editor key="create-${names.kebabCase}" />];

  return (
    <ContentListTable
      data={data}
      fields={[${displayFields}]}
      tableGeneratorType={Modules.${names.pascalCase}}
      functions={functions}
      title={t(\`types.${names.pluralKebab}\`, { count: 2 })}
    />
  );
}
`;
}

/**
 * Build display fields array for the table
 */
function buildDisplayFields(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const displayFields: string[] = [];

  // Always include name if it exists
  if (extendsContent || fields.some((f) => f.name === "name")) {
    displayFields.push(`${names.pascalCase}Fields.name`);
  }

  // Add author if present
  const authorRel = relationships.find((r) => r.variant === "Author");
  if (authorRel) {
    const authorFieldName = toCamelCase(authorRel.variant!);
    displayFields.push(`${names.pascalCase}Fields.${authorFieldName}`);
  }

  // Add first non-author relationship
  const otherRel = relationships.find((r) => r.variant !== "Author");
  if (otherRel) {
    const relFieldName = otherRel.single
      ? toCamelCase(otherRel.variant || otherRel.name)
      : pluralize(toCamelCase(otherRel.name));
    displayFields.push(`${names.pascalCase}Fields.${relFieldName}`);
  }

  // Add updatedAt
  displayFields.push(`${names.pascalCase}Fields.updatedAt`);

  return displayFields.join(", ");
}
