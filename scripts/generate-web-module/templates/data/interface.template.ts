/**
 * Interface Template
 *
 * Generates {Module}Interface.ts file with Input type and Interface definition.
 */

import { FrontendTemplateData, FrontendField, FrontendRelationship } from "../../types/template-data.interface";
import { toCamelCase, pluralize } from "../../transformers/name-transformer";

/**
 * Generate the interface file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateInterfaceTemplate(data: FrontendTemplateData): string {
  const { names, extendsContent, fields, relationships } = data;

  const imports = generateImports(data);
  const inputType = generateInputType(data);
  const interfaceDefinition = generateInterface(data);

  return `${imports}

${inputType}

${interfaceDefinition}
`;
}

/**
 * Generate import statements
 */
function generateImports(data: FrontendTemplateData): string {
  const { extendsContent, relationships } = data;
  const imports: string[] = [];

  // Relationship interface imports
  relationships.forEach((rel) => {
    imports.push(
      `import { ${rel.interfaceName} } from "${rel.interfaceImportPath}";`
    );
  });

  // Base interface import
  if (extendsContent) {
    imports.push(
      `import { ContentInput, ContentInterface } from "@/features/features/content/data/ContentInterface";`
    );
  } else {
    imports.push(
      `import { ApiDataInterface } from "@carlonicora/nextjs-jsonapi/core";`
    );
  }

  return imports.join("\n");
}

/**
 * Generate Input type definition
 */
function generateInputType(data: FrontendTemplateData): string {
  const { names, extendsContent, fields, relationships } = data;

  const fieldLines: string[] = ["  id: string;"];

  // Add fields (excluding inherited ones if extending Content)
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    const optional = field.nullable ? "?" : "";
    fieldLines.push(`  ${field.name}${optional}: ${field.tsType};`);
  });

  // Add relationship IDs and relationship property fields
  relationships.forEach((rel) => {
    const effectiveName = rel.variant || rel.name;
    if (rel.single) {
      const key = `${toCamelCase(effectiveName)}Id`;
      const optional = rel.nullable ? "?" : "";
      fieldLines.push(`  ${key}${optional}: string;`);

      // Add relationship property fields to input type (match relationship optionality)
      if (rel.fields && rel.fields.length > 0) {
        rel.fields.forEach((field) => {
          const fieldOptional = rel.nullable ? "?" : "";
          fieldLines.push(`  ${field.name}${fieldOptional}: ${field.tsType};`);
        });
      }
    } else {
      const key = `${toCamelCase(rel.name)}Ids`;
      fieldLines.push(`  ${key}?: string[];`);
    }
  });

  if (extendsContent) {
    return `export type ${names.pascalCase}Input = ContentInput & {
${fieldLines.join("\n")}
};`;
  } else {
    return `export type ${names.pascalCase}Input = {
${fieldLines.join("\n")}
};`;
  }
}

/**
 * Generate interface definition
 */
function generateInterface(data: FrontendTemplateData): string {
  const { names, extendsContent, fields, relationships } = data;

  const getterLines: string[] = [];

  // Add field getters (excluding inherited ones if extending Content)
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    getterLines.push(`  get ${field.name}(): ${field.tsType};`);
  });

  // Add relationship getters
  relationships.forEach((rel) => {
    const effectiveName = rel.variant || rel.name;
    if (rel.single) {
      const propertyName = toCamelCase(effectiveName);

      // Build return type - use intersection if relationship has fields
      let baseType = rel.interfaceName;
      if (rel.fields && rel.fields.length > 0) {
        const metaFields = rel.fields.map(f => `${f.name}?: ${f.tsType}`).join("; ");
        baseType = `${rel.interfaceName} & { ${metaFields} }`;
      }

      const type = rel.nullable ? `(${baseType}) | undefined` : baseType;
      getterLines.push(`  get ${propertyName}(): ${type};`);
    } else {
      const propertyName = pluralize(toCamelCase(rel.name));
      getterLines.push(`  get ${propertyName}(): ${rel.interfaceName}[];`);
    }
  });

  const baseInterface = extendsContent ? "ContentInterface" : "ApiDataInterface";

  return `export interface ${names.pascalCase}Interface extends ${baseInterface} {
${getterLines.join("\n")}
}`;
}
