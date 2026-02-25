/**
 * Field Mapping Types
 *
 * Defines the mapping rules between JSON schema field types
 * and their TypeScript, Zod, and form component equivalents.
 */

import { FormComponentType } from "./template-data.interface";

/**
 * Mapping from JSON type to TypeScript type
 */
export const JSON_TO_TS_TYPE: Record<string, string> = {
  string: "string",
  number: "number",
  boolean: "boolean",
  date: "Date",
  any: "any",
};

/**
 * Mapping from JSON type to Zod schema (base, without modifiers)
 */
export const JSON_TO_ZOD_BASE: Record<string, string> = {
  string: "z.string()",
  number: "z.number()",
  boolean: "z.boolean()",
  date: "z.date()",
  any: "z.any()",
};

/**
 * Special field names that get specific form components
 */
export const SPECIAL_FIELD_COMPONENTS: Record<string, FormComponentType> = {
  content: "BlockNoteEditor",
  description: "FormTextarea",
  abstract: "FormTextarea",
  body: "FormTextarea",
};

/**
 * Default form component by type
 */
export const TYPE_TO_FORM_COMPONENT: Record<string, FormComponentType> = {
  string: "FormInput",
  number: "FormInputNumber",
  boolean: "Checkbox",
  date: "DatePicker",
  any: "FormInput",
};

/**
 * Fields that indicate the module extends Content
 */
export const CONTENT_INDICATOR_FIELDS = ["name", "tldr", "abstract"];

/**
 * Standard fields added to all modules
 */
export const STANDARD_FIELDS = ["createdAt", "updatedAt"];

/**
 * Author variant special handling
 */
export const AUTHOR_VARIANT = "Author";

/**
 * Zod schema for author relationships
 */
export const AUTHOR_ZOD_SCHEMA = "userObjectSchema";

/**
 * Zod schema for entity relationships (non-author)
 */
export const ENTITY_ZOD_SCHEMA = "entityObjectSchema";

/**
 * Default icon for new modules
 */
export const DEFAULT_MODULE_ICON = "FileTextIcon";

/**
 * Get TypeScript type for a field
 */
export function getTsType(jsonType: string): string {
  return JSON_TO_TS_TYPE[jsonType] || "any";
}

/**
 * Get base Zod schema for a field type
 */
export function getZodBase(jsonType: string): string {
  return JSON_TO_ZOD_BASE[jsonType] || "z.any()";
}

/**
 * Get form component for a field
 */
export function getFormComponent(fieldName: string, fieldType: string): FormComponentType {
  // Check for special field names first, but only if the type is compatible
  // (e.g., "content" as a string field should NOT use BlockNoteEditor)
  if (SPECIAL_FIELD_COMPONENTS[fieldName]) {
    const specialComponent = SPECIAL_FIELD_COMPONENTS[fieldName];
    if (specialComponent === "BlockNoteEditor" && isContentField(fieldName, fieldType)) {
      return specialComponent;
    } else if (specialComponent !== "BlockNoteEditor") {
      return specialComponent;
    }
  }
  // Fall back to type-based component
  return TYPE_TO_FORM_COMPONENT[fieldType] || "FormInput";
}

/**
 * Check if a field indicates BlockNoteEditor should be used.
 * Only fields named "content" with non-primitive types (not string/number/boolean/date)
 * are treated as rich-content (JSON/BlockNote) fields.
 */
export function isContentField(fieldName: string, fieldType?: string): boolean {
  if (fieldName !== "content") return false;
  // If no type provided, assume it's a content field (backwards compat)
  if (!fieldType) return true;
  // Primitive types are NOT content fields even when named "content"
  const primitiveTypes = ["string", "number", "boolean", "date", "datetime"];
  return !primitiveTypes.includes(fieldType);
}

/**
 * Build complete Zod schema for a field
 */
export function buildZodSchema(fieldType: string, nullable: boolean, fieldName: string): string {
  const base = getZodBase(fieldType);

  // Content fields use z.any()
  if (isContentField(fieldName, fieldType)) {
    return "z.any()";
  }

  // String fields with min(1) for required
  if (fieldType === "string") {
    if (nullable) {
      return `${base}.optional()`;
    }
    return `${base}.min(1, { message: t(\`features.\${moduleName}.fields.${fieldName}.error\`) })`;
  }

  // Other fields with optional modifier
  if (nullable) {
    return `${base}.optional()`;
  }

  return base;
}
