/**
 * Field Mapper
 *
 * Maps JSON schema fields to their TypeScript, Zod, and form component equivalents.
 */

import { JsonFieldDefinition } from "../types/json-schema.interface";
import { FrontendField, FormComponentType } from "../types/template-data.interface";
import {
  getTsType,
  getZodBase,
  getFormComponent,
  isContentField,
  SPECIAL_FIELD_COMPONENTS,
} from "../types/field-mapping.types";

/**
 * Map a JSON field definition to a frontend field
 *
 * @param field - JSON field definition
 * @param moduleName - Module name for i18n error messages
 * @returns Frontend field representation
 */
export function mapField(field: JsonFieldDefinition, moduleName: string): FrontendField {
  const formComponent = getFormComponent(field.name, field.type);
  const isContent = isContentField(field.name);

  return {
    name: field.name,
    type: field.type,
    tsType: getTsType(field.type),
    zodSchema: buildZodSchema(field, moduleName),
    formComponent,
    nullable: field.nullable,
    isContentField: isContent,
  };
}

/**
 * Map all fields from JSON schema
 *
 * @param fields - Array of JSON field definitions
 * @param moduleName - Module name for i18n error messages
 * @returns Array of frontend field representations
 */
export function mapFields(fields: JsonFieldDefinition[], moduleName: string): FrontendField[] {
  return fields.map((field) => mapField(field, moduleName));
}

/**
 * Build complete Zod schema string for a field
 *
 * @param field - JSON field definition
 * @param moduleName - Module name (lowercase) for i18n keys
 * @returns Zod schema code string
 */
export function buildZodSchema(field: JsonFieldDefinition, moduleName: string): string {
  // Content fields always use z.any()
  if (isContentField(field.name)) {
    return "z.any()";
  }

  const base = getZodBase(field.type);

  // String fields with validation
  if (field.type === "string") {
    if (field.nullable) {
      return `${base}.optional()`;
    }
    // Required string with error message
    return `${base}.min(1, { message: t(\`features.${moduleName.toLowerCase()}.fields.${field.name}.error\`) })`;
  }

  // Number fields
  if (field.type === "number") {
    if (field.nullable) {
      return `${base}.optional()`;
    }
    return base;
  }

  // Boolean fields
  if (field.type === "boolean") {
    if (field.nullable) {
      return `${base}.optional()`;
    }
    return base;
  }

  // Date fields
  if (field.type === "date") {
    if (field.nullable) {
      return `z.coerce.date().optional()`;
    }
    return `z.coerce.date()`;
  }

  // Default case
  if (field.nullable) {
    return `${base}.optional()`;
  }
  return base;
}

/**
 * Get the form JSX for a field
 *
 * @param field - Frontend field
 * @param moduleName - Module name for i18n keys
 * @returns JSX code for the form field
 */
export function getFormFieldJsx(field: FrontendField, moduleName: string): string {
  const lowerModuleName = moduleName.toLowerCase();
  const isRequired = !field.nullable;

  switch (field.formComponent) {
    case "BlockNoteEditor":
      return `<FormContainerGeneric form={form} id="${field.name}" name={t(\`features.${lowerModuleName}.fields.${field.name}.label\`)}>
  <BlockNoteEditorContainer
    id={form.getValues("id")}
    type="${lowerModuleName}"
    initialContent={form.getValues("${field.name}")}
    onChange={(content, isEmpty, hasUnresolvedDiff) => {
      form.setValue("${field.name}", content);
    }}
    placeholder={t(\`features.${lowerModuleName}.fields.${field.name}.placeholder\`)}
    bordered
  />
</FormContainerGeneric>`;

    case "FormTextarea":
      return `<FormTextarea
  form={form}
  id="${field.name}"
  name={t(\`features.${lowerModuleName}.fields.${field.name}.label\`)}
  placeholder={t(\`features.${lowerModuleName}.fields.${field.name}.placeholder\`)}
  ${isRequired ? "isRequired" : ""}
/>`;

    case "Checkbox":
      return `<FormCheckbox
  form={form}
  id="${field.name}"
  name={t(\`features.${lowerModuleName}.fields.${field.name}.label\`)}
/>`;

    case "DatePicker":
      return `<FormDatePicker
  form={form}
  id="${field.name}"
  name={t(\`features.${lowerModuleName}.fields.${field.name}.label\`)}
  ${isRequired ? "isRequired" : ""}
/>`;

    case "FormInputNumber":
      return `<FormInput
  form={form}
  id="${field.name}"
  name={t(\`features.${lowerModuleName}.fields.${field.name}.label\`)}
  placeholder={t(\`features.${lowerModuleName}.fields.${field.name}.placeholder\`)}
  type="number"
  ${isRequired ? "isRequired" : ""}
/>`;

    case "FormInput":
    default:
      return `<FormInput
  form={form}
  id="${field.name}"
  name={t(\`features.${lowerModuleName}.fields.${field.name}.label\`)}
  placeholder={t(\`features.${lowerModuleName}.fields.${field.name}.placeholder\`)}
  ${isRequired ? "isRequired" : ""}
/>`;
  }
}

/**
 * Filter out inherited fields that shouldn't be generated
 *
 * @param fields - Array of frontend fields
 * @param inheritedFields - Array of field names inherited from parent
 * @returns Filtered array of fields
 */
export function filterInheritedFields(
  fields: FrontendField[],
  inheritedFields: string[]
): FrontendField[] {
  return fields.filter((f) => !inheritedFields.includes(f.name));
}

/**
 * Get fields that should be included in the editor form
 *
 * @param fields - Array of frontend fields
 * @returns Fields suitable for form editing
 */
export function getEditorFields(fields: FrontendField[]): FrontendField[] {
  // Exclude auto-generated fields like createdAt, updatedAt
  const excludeFields = ["createdAt", "updatedAt", "id"];
  return fields.filter((f) => !excludeFields.includes(f.name));
}
