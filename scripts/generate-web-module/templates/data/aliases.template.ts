/**
 * Aliases Template
 *
 * Generates {Module}Aliases.ts const object for type-safe alias references.
 * Only generated when the module has aliased relationships.
 */

import { FrontendTemplateData } from "../../types/template-data.interface";
import { toCamelCase, toKebabCase, pluralize } from "../../transformers/name-transformer";

/**
 * Generate the aliases file content
 *
 * @param data - Frontend template data
 * @returns Generated file content, or null if no aliases exist
 */
export function generateAliasesTemplate(data: FrontendTemplateData): string | null {
  const { names, relationships } = data;

  const aliasedRels = relationships.filter((rel) => rel.alias);
  if (aliasedRels.length === 0) return null;

  const entries = aliasedRels.map((rel) => {
    const endpoint = rel.single
      ? toKebabCase(rel.alias!)
      : pluralize(toKebabCase(rel.alias!));
    const property = toCamelCase(rel.alias!);

    return `  ${rel.alias}: {\n    endpoint: "${endpoint}",\n    property: "${property}",\n  },`;
  });

  return `export const ${names.pascalCase}Aliases = {\n${entries.join("\n")}\n} as const;\n`;
}
