/**
 * Interface Template
 *
 * Generates {Module}Interface.ts file with Input type and Interface definition.
 */

import { FrontendTemplateData, FrontendField, FrontendRelationship } from "../../types/template-data.interface";
import { toCamelCase, toPascalCase, pluralize } from "../../transformers/name-transformer";

/**
 * Build the named `<Pascal>RelationshipMeta` interface name for a relationship
 * that carries edge fields (mirrors live OpportunityInterface.ts).
 */
function relationshipMetaName(rel: FrontendRelationship): string {
  return `${toPascalCase(rel.alias ?? rel.name)}RelationshipMeta`;
}

/**
 * Generate the interface file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateInterfaceTemplate(data: FrontendTemplateData): string {
  const { names, extendsContent, fields, relationships } = data;

  const imports = generateImports(data);
  const metaInterfaces = generateMetaInterfaces(data);
  const inputType = generateInputType(data);
  const interfaceDefinition = generateInterface(data);

  return `${imports}
${metaInterfaces ? `\n${metaInterfaces}\n` : ""}
${inputType}

${interfaceDefinition}
`;
}

/**
 * Generate named `<Pascal>RelationshipMeta` interfaces for relationships that
 * carry edge fields. Reused by getters and the Input type's meta arrays.
 */
function generateMetaInterfaces(data: FrontendTemplateData): string {
  return data.relationships
    .filter((rel) => rel.fields && rel.fields.length > 0)
    .map((rel) => {
      const metaName = relationshipMetaName(rel);
      const body = rel
        .fields!.map((f) => `  ${f.name}${f.nullable ? "?" : ""}: ${f.tsType};`)
        .join("\n");
      return `export interface ${metaName} {\n${body}\n}`;
    })
    .join("\n\n");
}

/**
 * Generate import statements
 */
function generateImports(data: FrontendTemplateData): string {
  const { names, extendsContent, relationships } = data;
  const imports: string[] = [];

  // Relationship interface imports (deduplicated, skip self-referential)
  const seenInterfaces = new Set<string>();
  relationships.forEach((rel) => {
    if (rel.name === names.pascalCase) {
      return; // Skip self-reference - interface defined in this file
    }
    if (seenInterfaces.has(rel.interfaceName)) return;
    seenInterfaces.add(rel.interfaceName);
    imports.push(`import { ${rel.interfaceName} } from "${rel.interfaceImportPath}";`);
  });

  // Base interface import
  if (extendsContent) {
    imports.push(`import { ContentInput, ContentInterface } from "@/features/content/data/ContentInterface";`);
  } else {
    imports.push(`import { ApiDataInterface } from "@carlonicora/nextjs-jsonapi/core";`);
  }

  return imports.join("\n");
}

/**
 * Generate Input type definition
 */
function generateInputType(data: FrontendTemplateData): string {
  const { names, extendsContent, fields, relationships } = data;

  const fieldLines: string[] = ["  id: string;"];

  // Add fields (excluding inherited ones if extending Content, and read-only
  // fields which are server-derived and never sent back in the Input).
  const fieldsToInclude = (
    extendsContent ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name)) : fields
  ).filter((f) => !f.readOnly);

  fieldsToInclude.forEach((field) => {
    const optional = field.nullable ? "?" : "";
    fieldLines.push(`  ${field.name}${optional}: ${field.tsType};`);
  });

  // Add relationship IDs and relationship property fields
  relationships.forEach((rel) => {
    const effectiveName = rel.alias || rel.variant || rel.name;
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
      const effectiveMany = rel.alias || rel.name;
      const key = `${toCamelCase(effectiveMany)}Ids`;
      fieldLines.push(`  ${key}?: string[];`);

      // For many relationships with edge fields, also emit a parallel meta array.
      if (rel.fields && rel.fields.length > 0) {
        const metaShape = rel.fields.map((f) => `${f.name}: ${f.tsType}`).join("; ");
        fieldLines.push(`  ${toCamelCase(effectiveMany)}Meta?: { id: string; ${metaShape} }[];`);
      }
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
    const effectiveName = rel.alias || rel.variant || rel.name;
    if (rel.single) {
      const propertyName = toCamelCase(effectiveName);

      // Build return type - intersect with the named meta interface if the
      // relationship has edge fields.
      let baseType = rel.interfaceName;
      if (rel.fields && rel.fields.length > 0) {
        baseType = `${rel.interfaceName} & ${relationshipMetaName(rel)}`;
      }

      const type = rel.nullable ? `(${baseType}) | undefined` : baseType;
      getterLines.push(`  get ${propertyName}(): ${type};`);
    } else {
      const effectiveMany = rel.alias || rel.name;
      const propertyName = pluralize(toCamelCase(effectiveMany));
      // Intersect with the named meta interface if the relationship has edge fields.
      if (rel.fields && rel.fields.length > 0) {
        getterLines.push(`  get ${propertyName}(): (${rel.interfaceName} & ${relationshipMetaName(rel)})[];`);
      } else {
        getterLines.push(`  get ${propertyName}(): ${rel.interfaceName}[];`);
      }
    }
  });

  const baseInterface = extendsContent ? "ContentInterface" : "ApiDataInterface";

  return `export interface ${names.pascalCase}Interface extends ${baseInterface} {
${getterLines.join("\n")}
}`;
}
