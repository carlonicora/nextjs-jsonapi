/**
 * Model Template
 *
 * Generates {Module}.ts class file with rehydrate and createJsonApi methods.
 */

import { pluralize, toCamelCase, toPascalCase } from "../../transformers/name-transformer";
import { resolveRelationshipKey } from "../../transformers/relationship-key";
import { AUTHOR_VARIANT } from "../../types/field-mapping.types";
import { FrontendField, FrontendRelationship, FrontendTemplateData } from "../../types/template-data.interface";

/**
 * Build the named `<Pascal>RelationshipMeta` interface name for a relationship
 * that carries edge fields (mirrors live Opportunity.ts / OpportunityInterface.ts).
 *
 * These named interfaces are declared in the module's OWN `<Module>Interface.ts`
 * (emitted by interface.template.ts), so the model imports them from there.
 */
function relMetaName(rel: FrontendRelationship): string {
  return `${toPascalCase(rel.alias ?? rel.name)}RelationshipMeta`;
}

/**
 * Determine whether the model needs the `formatLocalDate` helper imported.
 *
 * True when any data field is a date/datetime, or any relationship edge field
 * is a date/datetime (edge dates would also be serialized via the helper).
 */
function hasDateField(data: FrontendTemplateData): boolean {
  const fieldIsDate = (type: string) => type === "date" || type === "datetime";
  if (data.fields.some((f) => fieldIsDate(f.type))) return true;
  return data.relationships.some((rel) => (rel.fields ?? []).some((f) => fieldIsDate(f.type)));
}

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

  // Own interface import — also pull in the named `<Pascal>RelationshipMeta`
  // interfaces, which are all declared in this module's own Interface file.
  const ownNamedImports = [`${names.pascalCase}Input`, `${names.pascalCase}Interface`];
  const seenMeta = new Set<string>();
  relationships.forEach((rel) => {
    if (!rel.fields || rel.fields.length === 0) return;
    const metaName = relMetaName(rel);
    if (seenMeta.has(metaName)) return;
    seenMeta.add(metaName);
    ownNamedImports.push(metaName);
  });
  ownNamedImports.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  imports.push(
    `import { ${ownNamedImports.join(", ")} } from "@/features/${data.importTargetDir}/${names.kebabCase}/data/${names.pascalCase}Interface";`,
  );

  // Relationship interface imports (deduplicated, skip self-referential)
  const seenInterfaces = new Set<string>();
  relationships.forEach((rel) => {
    if (rel.name === names.pascalCase) {
      return; // Skip self-reference - interface already imported
    }
    if (seenInterfaces.has(rel.interfaceName)) return;
    seenInterfaces.add(rel.interfaceName);
    imports.push(`import { ${rel.interfaceName} } from "${rel.interfaceImportPath}";`);
  });

  // Base class and core imports (sorted case-insensitively to match live output)
  const byName = (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase());
  const coreNames = ["JsonApiHydratedDataInterface", "Modules"];
  if (hasDateField(data)) coreNames.push("formatLocalDate");
  if (extendsContent) {
    imports.push(`import { Content } from "@/features/content/data/Content";`);
    imports.push(`import { ${coreNames.sort(byName).join(", ")} } from "@carlonicora/nextjs-jsonapi/core";`);
  } else {
    imports.push(
      `import { ${["AbstractApiData", ...coreNames].sort(byName).join(", ")} } from "@carlonicora/nextjs-jsonapi/core";`,
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
      const effectiveName = rel.alias || rel.variant || rel.name;
      if (rel.single) {
        const propName = toCamelCase(effectiveName);
        // Use intersection with the named meta interface if relationship has fields
        let typeDecl = rel.interfaceName;
        if (rel.fields && rel.fields.length > 0) {
          typeDecl = `${rel.interfaceName} & ${relMetaName(rel)}`;
        }
        lines.push(`  private _${propName}?: ${typeDecl};`);
      } else {
        const effectiveMany = rel.alias || rel.name;
        const propName = pluralize(toCamelCase(effectiveMany));
        // Use intersection with the named meta interface if relationship has fields (edge properties)
        if (rel.fields && rel.fields.length > 0) {
          lines.push(`  private _${propName}?: (${rel.interfaceName} & ${relMetaName(rel)})[];`);
        } else {
          lines.push(`  private _${propName}?: ${rel.interfaceName}[];`);
        }
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
      const effectiveName = rel.alias || rel.variant || rel.name;
      if (rel.single) {
        const propName = toCamelCase(effectiveName);

        // Build return type - intersect with the named meta interface if relationship has fields
        let baseType = rel.interfaceName;
        if (rel.fields && rel.fields.length > 0) {
          baseType = `${rel.interfaceName} & ${relMetaName(rel)}`;
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
        const effectiveMany = rel.alias || rel.name;
        const propName = pluralize(toCamelCase(effectiveMany));
        // Intersect with the named meta interface if relationship has fields (edge properties)
        if (rel.fields && rel.fields.length > 0) {
          lines.push(`  get ${propName}(): (${rel.interfaceName} & ${relMetaName(rel)})[] {
    return this._${propName} ?? [];
  }`);
        } else {
          lines.push(`  get ${propName}(): ${rel.interfaceName}[] {
    return this._${propName} ?? [];
  }`);
        }
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
    if (field.isContentField) {
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
      const effectiveName = rel.alias || rel.variant || rel.name;
      if (rel.single) {
        const propName = toCamelCase(effectiveName);
        const relationshipKey = resolveRelationshipKey(rel);

        // Use _readIncludedWithMeta for relationships with fields
        if (rel.fields && rel.fields.length > 0) {
          const metaType = relMetaName(rel);
          const singleCast = rel.nullable
            ? ` as (${rel.interfaceName} & ${metaType}) | undefined`
            : ` as ${rel.interfaceName} & ${metaType}`;
          lines.push(
            `    this._${propName} = this._readIncludedWithMeta<${rel.interfaceName}, ${metaType}>(data, "${relationshipKey}", Modules.${rel.name})${singleCast};`,
          );
        } else {
          lines.push(
            `    this._${propName} = this._readIncluded(data, "${relationshipKey}", Modules.${rel.name}) as ${rel.interfaceName}${rel.nullable ? " | undefined" : ""};`,
          );
        }
      } else {
        const effectiveMany = rel.alias || rel.name;
        const propName = pluralize(toCamelCase(effectiveMany));
        const relationshipKey = resolveRelationshipKey(rel);

        // Use _readIncludedWithMeta for relationships with fields (edge properties)
        if (rel.fields && rel.fields.length > 0) {
          const metaType = relMetaName(rel);
          lines.push(
            `    this._${propName} = this._readIncludedWithMeta<${rel.interfaceName}, ${metaType}>(data, "${relationshipKey}", Modules.${rel.name}) as (${rel.interfaceName} & ${metaType})[];`,
          );
        } else {
          lines.push(
            `    this._${propName} = this._readIncluded(data, "${relationshipKey}", Modules.${rel.name}) as ${rel.interfaceName}[];`,
          );
        }
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

  // Field serialization (excluding inherited and read-only fields).
  // read-only fields are server-derived: present in rehydrate/getters but never sent back.
  const fieldsToInclude = (
    extendsContent ? fields.filter((f) => !["name", "tldr", "abstract"].includes(f.name)) : fields
  ).filter((f) => !f.readOnly);

  fieldsToInclude.forEach((field) => {
    if (field.isContentField) {
      lines.push(
        `    if (data.${field.name} !== undefined) response.data.attributes.${field.name} = JSON.stringify(data.${field.name});`,
      );
    } else if (field.type === "date") {
      lines.push(
        `    if (data.${field.name} !== undefined) response.data.attributes.${field.name} = formatLocalDate(data.${field.name});`,
      );
    } else if (field.type === "datetime") {
      lines.push(
        `    if (data.${field.name} !== undefined) response.data.attributes.${field.name} = data.${field.name}.toISOString();`,
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
      const effectiveName = rel.alias || rel.variant || rel.name;
      const payloadKey = rel.single ? `${toCamelCase(effectiveName)}Id` : `${toCamelCase(effectiveName)}Ids`;
      const relationshipKey = resolveRelationshipKey(rel);

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
      } else if (rel.fields && rel.fields.length > 0) {
        // MANY relationship with edge fields: per-item meta resolved from a meta array.
        const metaProp = `${toCamelCase(effectiveName)}Meta`;
        lines.push(`    if (data.${payloadKey} !== undefined) {`);
        lines.push(`      response.data.relationships.${relationshipKey} = {`);
        lines.push(`        data: data.${payloadKey}.map((id) => {`);
        lines.push(`          const meta = data.${metaProp}?.find((m) => m.id === id);`);
        lines.push(`          return {`);
        lines.push(`            type: Modules.${rel.name}.name,`);
        lines.push(`            id,`);
        lines.push(
          `            ...(meta ? { meta: { ${rel.fields.map((f) => `${f.name}: meta.${f.name}`).join(", ")} } } : {}),`,
        );
        lines.push(`          };`);
        lines.push(`        }),`);
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
  if (field.isContentField) {
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
