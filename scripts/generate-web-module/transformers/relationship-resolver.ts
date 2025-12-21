/**
 * Relationship Resolver
 *
 * Resolves JSON relationship definitions to frontend representations
 * including form fields, imports, and service methods.
 */

import { JsonRelationshipDefinition } from "../types/json-schema.interface";
import { FrontendRelationship, FrontendField, RelationshipServiceMethod } from "../types/template-data.interface";
import { AUTHOR_VARIANT, AUTHOR_ZOD_SCHEMA, ENTITY_ZOD_SCHEMA } from "../types/field-mapping.types";
import { toCamelCase, toKebabCase, pluralize, toPascalCase } from "./name-transformer";
import { mapFields } from "./field-mapper";

/**
 * Foundation package constants for web imports
 * Components (selectors) come from /components
 * Data (interfaces, services) come from /core
 */
export const FOUNDATION_COMPONENTS_PACKAGE = "@carlonicora/nextjs-jsonapi/components";
export const FOUNDATION_CORE_PACKAGE = "@carlonicora/nextjs-jsonapi/core";

/**
 * Check if a directory represents a foundation import (from the package)
 *
 * @param directory - The directory string from relationship definition
 * @returns True if this should import from the foundation package
 */
export function isFoundationImport(directory: string): boolean {
  return directory === "@foundation" || directory.startsWith("@foundation/");
}

/**
 * Resolve a JSON relationship to frontend representation
 *
 * @param rel - JSON relationship definition
 * @returns Frontend relationship representation
 */
export function resolveRelationship(rel: JsonRelationshipDefinition): FrontendRelationship {
  const isAuthor = rel.variant === AUTHOR_VARIANT;
  const effectiveName = rel.variant || rel.name;
  const effectiveNameLower = toCamelCase(effectiveName);
  const modelKebab = toKebabCase(rel.name);

  // Form field ID
  const formFieldId = effectiveNameLower;
  const formFieldIdPlural = pluralize(effectiveNameLower);

  // Payload field ID for API calls
  let payloadFieldId: string;
  if (rel.single) {
    payloadFieldId = `${effectiveNameLower}Id`;
  } else {
    payloadFieldId = `${toCamelCase(rel.name)}Ids`;
  }

  // Selector component name
  let selectorComponent: string;
  if (rel.single) {
    selectorComponent = `${rel.name}Selector`;
  } else {
    selectorComponent = `${rel.name}MultiSelector`;
  }

  // Zod schema
  let zodSchema: string;
  if (isAuthor) {
    zodSchema = rel.nullable
      ? `${AUTHOR_ZOD_SCHEMA}.optional()`
      : `${AUTHOR_ZOD_SCHEMA}.refine((data) => data.id && data.id.length > 0, { message: t(\`generic.relationships.author.error\`) })`;
  } else if (rel.single) {
    zodSchema = rel.nullable
      ? `${ENTITY_ZOD_SCHEMA}.optional()`
      : `${ENTITY_ZOD_SCHEMA}.refine((data) => data.id && data.id.length > 0, { message: t(\`generic.relationships.${effectiveNameLower}.error\`) })`;
  } else {
    zodSchema = rel.nullable ? `z.array(${ENTITY_ZOD_SCHEMA}).optional()` : `z.array(${ENTITY_ZOD_SCHEMA})`;
  }

  // Import paths - check for foundation imports
  let importPath: string;
  let interfaceImportPath: string;
  let serviceImportPath: string;

  if (isFoundationImport(rel.directory)) {
    // Foundation entities import from the package
    importPath = FOUNDATION_COMPONENTS_PACKAGE;        // Selectors from /components
    interfaceImportPath = FOUNDATION_CORE_PACKAGE;     // Interfaces from /core
    serviceImportPath = FOUNDATION_CORE_PACKAGE;       // Services from /core
  } else {
    // Feature entities use local paths
    const webDirectory = mapDirectoryToWebPath(rel.directory);
    importPath = `@/features/${webDirectory}/${modelKebab}/components/forms/${selectorComponent}`;
    interfaceImportPath = `@/features/${webDirectory}/${modelKebab}/data/${rel.name}Interface`;
    serviceImportPath = `@/features/${webDirectory}/${modelKebab}/data/${rel.name}Service`;
  }

  // Map relationship fields (only for single relationships)
  let fields: FrontendField[] | undefined;
  if (rel.single && rel.fields && rel.fields.length > 0) {
    fields = mapFields(rel.fields, toCamelCase(rel.name));
  }

  return {
    name: rel.name,
    variant: rel.variant,
    directory: rel.directory,
    single: rel.single,
    nullable: rel.nullable,
    isFoundation: isFoundationImport(rel.directory),
    formFieldId,
    formFieldIdPlural,
    payloadFieldId,
    selectorComponent,
    zodSchema,
    importPath,
    interfaceImportPath,
    serviceImportPath,
    interfaceName: `${rel.name}Interface`,
    modelKebab,
    fields,
  };
}

/**
 * Resolve all relationships from JSON schema
 *
 * @param relationships - Array of JSON relationship definitions
 * @returns Array of frontend relationship representations
 */
export function resolveRelationships(relationships: JsonRelationshipDefinition[]): FrontendRelationship[] {
  return relationships.map(resolveRelationship);
}

/**
 * Map directory value to web path
 * e.g., "features" -> "features", "foundations" -> "foundations"
 *
 * @param directory - Directory value from JSON
 * @returns Web path segment
 */
export function mapDirectoryToWebPath(directory: string): string {
  // The directory value maps directly to the web path
  return directory;
}

/**
 * Generate service method definitions for relationships
 *
 * @param relationships - Array of frontend relationships
 * @returns Array of service method definitions
 */
export function generateServiceMethods(relationships: FrontendRelationship[]): RelationshipServiceMethod[] {
  return relationships.map((rel) => {
    const effectiveName = rel.variant || rel.name;
    return {
      methodName: `findManyBy${toPascalCase(effectiveName)}`,
      paramName: `${toCamelCase(effectiveName)}Id`,
      relationshipName: rel.name,
      relationshipEndpoint: pluralize(toKebabCase(rel.name)),
    };
  });
}

/**
 * Get unique selector imports needed for the editor
 *
 * @param relationships - Array of frontend relationships
 * @returns Deduplicated array of import statements
 */
export function getSelectorImports(relationships: FrontendRelationship[]): string[] {
  const imports = new Set<string>();

  relationships.forEach((rel) => {
    if (isFoundationImport(rel.directory)) {
      // Foundation entities use named imports from the package
      imports.add(`import { ${rel.selectorComponent} } from "${FOUNDATION_COMPONENTS_PACKAGE}";`);
    } else {
      imports.add(`import ${rel.selectorComponent} from "${rel.importPath}";`);
    }
  });

  return Array.from(imports);
}

/**
 * Get form JSX for a relationship field
 *
 * @param rel - Frontend relationship
 * @param moduleName - Module name for i18n keys
 * @returns JSX code for the relationship selector
 */
export function getRelationshipFormJsx(rel: FrontendRelationship, moduleName: string): string {
  const isRequired = !rel.nullable;
  const lowerModuleName = moduleName.toLowerCase();

  if (rel.single) {
    // Single selector
    if (rel.variant === AUTHOR_VARIANT) {
      // Author is auto-set, usually not shown in form or read-only
      return "";
    }
    return `<${rel.name}Selector
  id="${rel.formFieldId}"
  form={form}
  label={t(\`generic.relationships.${rel.formFieldId}.label\`)}
  placeholder={t(\`generic.relationships.${rel.formFieldId}.placeholder\`)}
  ${isRequired ? "isRequired" : ""}
/>`;
  } else {
    // Multi selector
    return `<${rel.name}MultiSelector
  id="${rel.formFieldId}"
  form={form}
  label={t(\`types.${pluralize(toKebabCase(rel.name))}\`, { count: 2 })}
/>`;
  }
}

/**
 * Get default value expression for a relationship in form
 *
 * @param rel - Frontend relationship
 * @param modelVarName - Variable name for the model (e.g., "article")
 * @returns Expression for default value
 */
export function getDefaultValueExpression(rel: FrontendRelationship, modelVarName: string): string {
  const propertyName = rel.variant ? toCamelCase(rel.variant) : toCamelCase(rel.name);
  const pluralPropertyName = pluralize(propertyName);

  if (rel.single) {
    if (rel.variant === AUTHOR_VARIANT) {
      // Author has special shape with avatar
      return `${modelVarName}?.${propertyName}
        ? { id: ${modelVarName}.${propertyName}.id, name: ${modelVarName}.${propertyName}.name, avatar: ${modelVarName}.${propertyName}.avatar }
        : undefined`;
    }
    return `${modelVarName}?.${propertyName}
        ? { id: ${modelVarName}.${propertyName}.id, name: ${modelVarName}.${propertyName}.name }
        : undefined`;
  } else {
    // Multi-select
    return `${modelVarName}?.${pluralPropertyName}
        ? ${modelVarName}.${pluralPropertyName}.map((item) => ({ id: item.id, name: item.name }))
        : []`;
  }
}

/**
 * Get payload mapping for a relationship
 *
 * @param rel - Frontend relationship
 * @returns Payload field assignment code
 */
export function getPayloadMapping(rel: FrontendRelationship): string {
  if (rel.single) {
    return `${rel.payloadFieldId}: values.${rel.formFieldId}?.id`;
  } else {
    return `${rel.payloadFieldId}: values.${rel.formFieldId} ? values.${rel.formFieldId}.map((item) => item.id) : []`;
  }
}
