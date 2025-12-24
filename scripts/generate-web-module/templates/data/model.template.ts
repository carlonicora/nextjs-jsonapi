/**
 * Model Template
 *
 * Generates {Module}.ts class file with rehydrate and createJsonApi methods.
 */

import { pluralize, toCamelCase } from "../../transformers/name-transformer";
import { AUTHOR_VARIANT } from "../../types/field-mapping.types";
import { FrontendField, FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Generate the model file content
 *
 * @param data - Frontend template data
 * @returns Generated file content
 */
export function generateModelTemplate(data: FrontendTemplateData): string {
  const { names, extendsContent, fields, relationships } = data;

  const imports = generateImports(data);
  const privateFields = generatePrivateFields(data);
  const getters = generateGetters(data);
  const rehydrateMethod = generateRehydrateMethod(data);
  const createJsonApiMethod = generateCreateJsonApiMethod(data);

  const baseClass = extendsContent ? "Content" : "AbstractApiData";

  return `${imports}

export class ${names.pascalCase} extends ${baseClass} implements ${names.pascalCase}Interface {
${privateFields}

${getters}

${rehydrateMethod}

${createJsonApiMethod}
}
`;
}

/**
 * Generate import statements
 */
function generateImports(data: FrontendTemplateData): string {
  const { names, extendsContent, relationships } = data;
  const imports: string[] = [];

  // Own interface import
  imports.push(
    `import { ${names.pascalCase}Input, ${names.pascalCase}Interface } from "@/features/${data.targetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";`,
  );

  // Relationship interface imports
  relationships.forEach((rel) => {
    imports.push(`import { ${rel.interfaceName} } from "${rel.interfaceImportPath}";`);
  });

  // Base class and core imports
  if (extendsContent) {
    imports.push(`import { Content } from "@/features/features/content/data/Content";`);
    imports.push(`import { JsonApiHydratedDataInterface, Modules } from "@carlonicora/nextjs-jsonapi/core";`);
  } else {
    imports.push(
      `import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "@carlonicora/nextjs-jsonapi/core";`,
    );
  }

  return imports.join("\n");
}

/**
 * Generate private field declarations
 */
function generatePrivateFields(data: FrontendTemplateData): string {
  const { fields, relationships, extendsContent } = data;
  const lines: string[] = [];

  // Field private members (excluding inherited)
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    lines.push(`  private _${field.name}?: ${field.tsType};`);
  });

  // Relationship private members
  if (!extendsContent) {
    relationships.forEach((rel) => {
      const effectiveName = rel.variant || rel.name;
      if (rel.single) {
        const propName = toCamelCase(effectiveName);
        // Use intersection type if relationship has fields
        let typeDecl = rel.interfaceName;
        if (rel.fields && rel.fields.length > 0) {
          const metaFields = rel.fields.map((f) => `${f.name}?: ${f.tsType}`).join("; ");
          typeDecl = `${rel.interfaceName} & { ${metaFields} }`;
        }
        lines.push(`  private _${propName}?: ${typeDecl};`);
      } else {
        const propName = pluralize(toCamelCase(rel.name));
        lines.push(`  private _${propName}?: ${rel.interfaceName}[];`);
      }
    });
  }

  return lines.join("\n");
}

/**
 * Generate getter methods
 */
function generateGetters(data: FrontendTemplateData): string {
  const { fields, relationships, extendsContent } = data;
  const lines: string[] = [];

  // Field getters (excluding inherited)
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    const defaultValue = getDefaultValue(field);
    lines.push(`  get ${field.name}(): ${field.tsType} {
    return this._${field.name} ?? ${defaultValue};
  }`);
  });

  // Relationship getters (only for non-Content extending)
  if (!extendsContent) {
    relationships.forEach((rel) => {
      const effectiveName = rel.variant || rel.name;
      if (rel.single) {
        const propName = toCamelCase(effectiveName);

        // Build return type - use intersection if relationship has fields
        let baseType = rel.interfaceName;
        if (rel.fields && rel.fields.length > 0) {
          const metaFields = rel.fields.map((f) => `${f.name}?: ${f.tsType}`).join("; ");
          baseType = `${rel.interfaceName} & { ${metaFields} }`;
        }

        if (rel.nullable) {
          lines.push(`  get ${propName}(): (${baseType}) | undefined {
    return this._${propName};
  }`);
        } else {
          lines.push(`  get ${propName}(): ${baseType} {
    if (this._${propName} === undefined) throw new Error("JsonApi error: ${data.names.camelCase} ${propName} is missing");
    return this._${propName};
  }`);
        }
      } else {
        const propName = pluralize(toCamelCase(rel.name));
        lines.push(`  get ${propName}(): ${rel.interfaceName}[] {
    return this._${propName} ?? [];
  }`);
      }
    });
  }

  return lines.join("\n\n");
}

/**
 * Generate rehydrate method
 */
function generateRehydrateMethod(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const lines: string[] = [];

  lines.push(`  rehydrate(data: JsonApiHydratedDataInterface): this {`);
  lines.push(`    super.rehydrate(data);`);
  lines.push(``);

  // Field rehydration (excluding inherited)
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    if (field.isContentField || field.name === "content") {
      // Content fields need JSON parsing
      lines.push(
        `    this._${field.name} = data.jsonApi.attributes.${field.name} ? JSON.parse(data.jsonApi.attributes.${field.name}) : undefined;`,
      );
    } else if (field.type === "date") {
      lines.push(
        `    this._${field.name} = data.jsonApi.attributes.${field.name} ? new Date(data.jsonApi.attributes.${field.name}) : undefined;`,
      );
    } else {
      lines.push(`    this._${field.name} = data.jsonApi.attributes.${field.name};`);
    }
  });

  // Relationship rehydration (only for non-Content)
  if (!extendsContent && relationships.length > 0) {
    lines.push(``);
    relationships.forEach((rel) => {
      const effectiveName = rel.variant || rel.name;
      if (rel.single) {
        const propName = toCamelCase(effectiveName);
        const relationshipKey = effectiveName.toLowerCase();

        // Use _readIncludedWithMeta for relationships with fields
        if (rel.fields && rel.fields.length > 0) {
          const metaType = `{ ${rel.fields.map((f) => `${f.name}?: ${f.tsType}`).join("; ")} }`;
          const nullableCast = rel.nullable ? ` as (${rel.interfaceName} & ${metaType}) | undefined` : "";
          lines.push(
            `    this._${propName} = this._readIncludedWithMeta<${rel.interfaceName}, ${metaType}>(data, "${relationshipKey}", Modules.${rel.name})${nullableCast};`,
          );
        } else {
          lines.push(
            `    this._${propName} = this._readIncluded(data, "${relationshipKey}", Modules.${rel.name}) as ${rel.interfaceName}${rel.nullable ? " | undefined" : ""};`,
          );
        }
      } else {
        const propName = pluralize(toCamelCase(rel.name));
        const relationshipKey = pluralize(rel.name.toLowerCase());
        lines.push(
          `    this._${propName} = this._readIncluded(data, "${relationshipKey}", Modules.${rel.name}) as ${rel.interfaceName}[];`,
        );
      }
    });
  }

  lines.push(``);
  lines.push(`    return this;`);
  lines.push(`  }`);

  return lines.join("\n");
}

/**
 * Generate createJsonApi method
 */
function generateCreateJsonApiMethod(data: FrontendTemplateData): string {
  const { names, fields, relationships, extendsContent } = data;
  const lines: string[] = [];

  lines.push(`  createJsonApi(data: ${names.pascalCase}Input) {`);
  lines.push(`    const response: any = {`);
  lines.push(`      data: {`);
  lines.push(`        type: Modules.${names.pascalCase}.name,`);
  lines.push(`        id: data.id,`);
  lines.push(`        attributes: {},`);
  lines.push(`        meta: {},`);
  lines.push(`        relationships: {},`);
  lines.push(`      },`);
  lines.push(`      included: [],`);
  lines.push(`    };`);
  lines.push(``);

  // Call super.addContentInput if extending Content
  if (extendsContent) {
    lines.push(`    super.addContentInput(response, data);`);
    lines.push(``);
  }

  // Field serialization (excluding inherited)
  const fieldsToInclude = extendsContent
    ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name))
    : fields;

  fieldsToInclude.forEach((field) => {
    if (field.isContentField || field.name === "content") {
      lines.push(
        `    if (data.${field.name} !== undefined) response.data.attributes.${field.name} = JSON.stringify(data.${field.name});`,
      );
    } else {
      lines.push(
        `    if (data.${field.name} !== undefined) response.data.attributes.${field.name} = data.${field.name};`,
      );
    }
  });

  // Relationship serialization (skip author for Content, handle others)
  const relationshipsToSerialize = relationships.filter((rel) => !(extendsContent && rel.variant === AUTHOR_VARIANT));

  if (relationshipsToSerialize.length > 0) {
    lines.push(``);
    relationshipsToSerialize.forEach((rel) => {
      const effectiveName = rel.variant || rel.name;
      const payloadKey = rel.single ? `${toCamelCase(effectiveName)}Id` : `${toCamelCase(rel.name)}Ids`;
      const relationshipKey = toCamelCase(effectiveName);

      if (rel.single) {
        lines.push(`    if (data.${payloadKey}) {`);
        lines.push(`      response.data.relationships.${relationshipKey} = {`);
        lines.push(`        data: {`);
        lines.push(`          type: Modules.${rel.name}.name,`);
        lines.push(`          id: data.${payloadKey},`);
        lines.push(`        },`);

        // Add meta for relationship fields
        if (rel.fields && rel.fields.length > 0) {
          lines.push(`        meta: {`);
          rel.fields.forEach((field, i) => {
            const comma = i < rel.fields!.length - 1 ? "," : "";
            lines.push(`          ${field.name}: data.${field.name}${comma}`);
          });
          lines.push(`        },`);
        }

        lines.push(`      };`);
        lines.push(`    }`);
      } else {
        lines.push(`    if (data.${payloadKey} && data.${payloadKey}.length > 0) {`);
        lines.push(`      response.data.relationships.${relationshipKey} = {`);
        lines.push(`        data: data.${payloadKey}.map((id) => ({`);
        lines.push(`          type: Modules.${rel.name}.name,`);
        lines.push(`          id,`);
        lines.push(`        })),`);
        lines.push(`      };`);
        lines.push(`    }`);
      }
    });
  }

  lines.push(``);
  lines.push(`    return response;`);
  lines.push(`  }`);

  return lines.join("\n");
}

/**
 * Get default value for a field type
 */
function getDefaultValue(field: FrontendField): string {
  if (field.isContentField || field.name === "content") {
    return "[]";
  }

  switch (field.type) {
    case "string":
      return '""';
    case "number":
      return "0";
    case "boolean":
      return "false";
    case "date":
      return "new Date()";
    case "any":
      return "undefined";
    default:
      return "undefined";
  }
}
