/**
 * Name Transformer
 *
 * Transforms module names to various case conventions
 * needed for code generation.
 */

import { NameTransforms } from "../types/template-data.interface";

/**
 * Transform a module name to all necessary case conventions
 *
 * @param moduleName - PascalCase module name (e.g., "Comment")
 * @param endpoint - Optional kebab-case plural endpoint (e.g., "comments"), derived from moduleName if not provided
 * @returns All name transformations
 */
export function transformNames(moduleName: string, endpoint?: string): NameTransforms {
  const pluralPascal = toPascalCase(pluralize(moduleName));
  const pluralCamel = toCamelCase(pluralPascal);
  const pluralKebab = endpoint || toKebabCase(pluralize(moduleName));

  return {
    pascalCase: moduleName,
    camelCase: toCamelCase(moduleName),
    kebabCase: toKebabCase(moduleName),
    pluralPascal,
    pluralCamel,
    pluralKebab,
    titleCase: toTitleCase(moduleName),
    pluralTitleCase: toTitleCase(pluralPascal),
  };
}

/**
 * Convert PascalCase to camelCase
 *
 * @param str - PascalCase string
 * @returns camelCase string
 */
export function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Convert PascalCase to kebab-case
 *
 * @param str - PascalCase string
 * @returns kebab-case string
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

/**
 * Convert string to PascalCase
 *
 * @param str - Any case string
 * @returns PascalCase string
 */
export function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert PascalCase/camelCase to Title Case with spaces
 * e.g., "firstName" -> "First Name", "UserProfile" -> "User Profile"
 *
 * @param str - PascalCase or camelCase string
 * @returns Title Case string with spaces
 */
export function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

/**
 * Simple pluralization
 * Note: This is a basic implementation. For production, consider using a library like 'pluralize'
 *
 * @param str - Singular form
 * @returns Plural form
 */
export function pluralize(str: string): string {
  if (str.endsWith("s")) {
    return str + "es";
  }
  if (str.endsWith("y") && !["a", "e", "i", "o", "u"].includes(str[str.length - 2])) {
    return str.slice(0, -1) + "ies";
  }
  return str + "s";
}

/**
 * Simple singularization (reverse of pluralize)
 *
 * @param str - Plural form
 * @returns Singular form
 */
export function singularize(str: string): string {
  if (str.endsWith("ies")) {
    return str.slice(0, -3) + "y";
  }
  if (str.endsWith("ses") || str.endsWith("xes") || str.endsWith("zes")) {
    return str.slice(0, -2);
  }
  if (str.endsWith("s") && !str.endsWith("ss")) {
    return str.slice(0, -1);
  }
  return str;
}
