/**
 * i18n Generator
 *
 * Generates internationalization keys and messages for a module.
 */

import { FrontendField, FrontendRelationship, I18nKeySet, NameTransforms } from "../types/template-data.interface";
import { toTitleCase, pluralize, toCamelCase, toKebabCase } from "./name-transformer";

/**
 * Generate complete i18n key set for a module
 *
 * @param names - Name transforms
 * @param fields - Array of frontend fields
 * @param relationships - Array of frontend relationships
 * @returns i18n key set
 */
export function generateI18nKeys(
  names: NameTransforms,
  fields: FrontendField[],
  relationships: FrontendRelationship[]
): I18nKeySet {
  const lowerModuleName = names.camelCase.toLowerCase();

  // Generate field keys
  const fieldKeys: I18nKeySet["fields"] = {};
  fields.forEach((field) => {
    fieldKeys[field.name] = {
      label: toTitleCase(field.name),
      placeholder: `Enter ${toTitleCase(field.name).toLowerCase()}`,
      error: `${toTitleCase(field.name)} is required`,
    };
  });

  // Generate relationship keys
  const relationshipKeys: I18nKeySet["relationships"] = {};
  relationships.forEach((rel) => {
    const effectiveName = rel.variant || rel.name;
    const effectiveKey = toCamelCase(effectiveName).toLowerCase();
    relationshipKeys[effectiveKey] = {
      label: toTitleCase(effectiveName),
      placeholder: `Select ${toTitleCase(effectiveName).toLowerCase()}`,
      error: `${toTitleCase(effectiveName)} is required`,
      list: pluralize(toTitleCase(rel.name)),
    };

    // Add fields for relationship edge properties
    if (rel.fields && rel.fields.length > 0) {
      relationshipKeys[effectiveKey].fields = {};
      rel.fields.forEach((field) => {
        relationshipKeys[effectiveKey].fields![field.name] = {
          label: toTitleCase(field.name),
          placeholder: `Enter ${toTitleCase(field.name).toLowerCase()}`,
          error: `${toTitleCase(field.name)} is required`,
        };
      });
    }
  });

  // Generate type keys
  const singularTitle = names.titleCase;
  const pluralTitle = names.pluralTitleCase;

  return {
    moduleName: lowerModuleName,
    fields: fieldKeys,
    relationships: relationshipKeys,
    type: {
      singular: singularTitle,
      plural: pluralTitle,
      icuPlural: `{count, plural, =1 {${singularTitle}} other {${pluralTitle}}}`,
    },
  };
}

/**
 * Build the i18n message object to merge into en.json
 *
 * @param i18nKeys - i18n key set
 * @returns Object structure for en.json
 */
export function buildI18nMessages(i18nKeys: I18nKeySet): Record<string, any> {
  // Use proper pluralization and lowercase for types key
  const pluralLowercaseKey = pluralize(i18nKeys.moduleName).toLowerCase();

  return {
    features: {
      [i18nKeys.moduleName]: {
        fields: i18nKeys.fields,
        relationships: i18nKeys.relationships,
      },
    },
    types: {
      [pluralLowercaseKey]: i18nKeys.type.icuPlural,
    },
  };
}

/**
 * Get the translation key path for a field label
 *
 * @param moduleName - Module name (lowercase)
 * @param fieldName - Field name
 * @returns Translation key path
 */
export function getFieldLabelKey(moduleName: string, fieldName: string): string {
  return `features.${moduleName}.fields.${fieldName}.label`;
}

/**
 * Get the translation key path for a field placeholder
 *
 * @param moduleName - Module name (lowercase)
 * @param fieldName - Field name
 * @returns Translation key path
 */
export function getFieldPlaceholderKey(moduleName: string, fieldName: string): string {
  return `features.${moduleName}.fields.${fieldName}.placeholder`;
}

/**
 * Get the translation key path for a field error
 *
 * @param moduleName - Module name (lowercase)
 * @param fieldName - Field name
 * @returns Translation key path
 */
export function getFieldErrorKey(moduleName: string, fieldName: string): string {
  return `features.${moduleName}.fields.${fieldName}.error`;
}

/**
 * Get the translation key path for type pluralization
 *
 * @param pluralKebab - Plural kebab-case name
 * @returns Translation key path
 */
export function getTypeKey(pluralKebab: string): string {
  return `types.${pluralKebab}`;
}

/**
 * Generate translation call for use in templates
 *
 * @param keyPath - Full translation key path
 * @param params - Optional parameters for ICU messages
 * @returns Translation function call as string
 */
export function generateTranslationCall(
  keyPath: string,
  params?: Record<string, any>
): string {
  if (params) {
    const paramStr = JSON.stringify(params);
    return `t(\`${keyPath}\`, ${paramStr})`;
  }
  return `t(\`${keyPath}\`)`;
}

/**
 * Merge i18n messages into existing messages object
 * This performs a deep merge, preserving existing keys
 *
 * @param existing - Existing messages object
 * @param newMessages - New messages to merge
 * @returns Merged messages object
 */
export function mergeI18nMessages(
  existing: Record<string, any>,
  newMessages: Record<string, any>
): Record<string, any> {
  const result = { ...existing };

  function deepMerge(target: Record<string, any>, source: Record<string, any>): void {
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  deepMerge(result, newMessages);
  return result;
}

/**
 * Sort object keys alphabetically (for consistent output)
 *
 * @param obj - Object to sort
 * @returns New object with sorted keys
 */
export function sortObjectKeys(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      sorted[key] = sortObjectKeys(obj[key]);
    } else {
      sorted[key] = obj[key];
    }
  }

  return sorted;
}
