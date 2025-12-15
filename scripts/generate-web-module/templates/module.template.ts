/**
 * Module Template
 *
 * Generates {Module}Module.ts for module configuration and registration.
 */

import { FrontendTemplateData } from "../types/template-data.interface";
import { DEFAULT_MODULE_ICON } from "../types/field-mapping.types";

/**
 * Generate the module configuration file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateModuleTemplate(data: FrontendTemplateData): string {
  const { names, moduleId, endpoint, fields, extendsContent } = data;

  // Build inclusions for lists
  const listFieldNames = getListFieldNames(data);
  const listInclusionFields = listFieldNames.map((f) => `\`${f}\``).join(", ");

  return `import { ${names.pascalCase} } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}";
import { createJsonApiInclusion } from "@carlonicora/nextjs-jsonapi/core";
import { ModuleFactory } from "@carlonicora/nextjs-jsonapi/permissions";
import { ${DEFAULT_MODULE_ICON} } from "lucide-react";

export const ${names.pascalCase}Module = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/${names.pluralKebab}",
    name: "${names.pluralCamel}",
    model: ${names.pascalCase},
    moduleId: "${moduleId}",
    icon: ${DEFAULT_MODULE_ICON},
    inclusions: {
      lists: {
        fields: [
          createJsonApiInclusion("${endpoint}", [${listInclusionFields}]),
          createJsonApiInclusion("users", [\`name\`, \`avatar\`]),
        ],
      },
    },
  });
`;
}

/**
 * Get field names suitable for list display
 */
function getListFieldNames(data: FrontendTemplateData): string[] {
  const { fields, extendsContent } = data;
  const fieldNames: string[] = [];

  // Content-extending modules get name, tldr
  if (extendsContent) {
    fieldNames.push("name", "tldr");
  }

  // Add other displayable fields (not content or abstract)
  fields.forEach((field) => {
    if (!["id", "content", "abstract", "createdAt", "updatedAt"].includes(field.name)) {
      if (!fieldNames.includes(field.name)) {
        fieldNames.push(field.name);
      }
    }
  });

  return fieldNames;
}
