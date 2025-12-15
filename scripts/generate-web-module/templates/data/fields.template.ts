/**
 * Fields Template
 *
 * Generates {Module}Fields.ts enum file for type-safe field references.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";
import { toCamelCase, pluralize } from "../../transformers/name-transformer";

/**
 * Generate the fields enum file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateFieldsTemplate(data: FrontendTemplateData): string {
  const { names, fields, relationships, tableFieldNames } = data;

  const enumEntries = generateEnumEntries(data);

  return `export enum ${names.pascalCase}Fields {
${enumEntries}
}
`;
}

/**
 * Generate enum entries
 */
function generateEnumEntries(data: FrontendTemplateData): string {
  const { names, fields, relationships } = data;
  const entries: string[] = [];

  // Add module ID field
  entries.push(`  ${names.camelCase}Id = "${names.camelCase}Id",`);
  entries.push(``);

  // Add primitive fields
  const fieldNames = fields.map((f) => f.name);
  fieldNames.forEach((name) => {
    entries.push(`  ${name} = "${name}",`);
  });

  if (relationships.length > 0) {
    entries.push(``);
  }

  // Add relationship fields
  relationships.forEach((rel) => {
    const effectiveName = rel.variant || rel.name;
    const key = rel.single
      ? toCamelCase(effectiveName)
      : pluralize(toCamelCase(rel.name));
    entries.push(`  ${key} = "${key}",`);
  });

  entries.push(``);

  // Add standard timestamp fields
  entries.push(`  createdAt = "createdAt",`);
  entries.push(`  updatedAt = "updatedAt",`);

  return entries.join("\n");
}
