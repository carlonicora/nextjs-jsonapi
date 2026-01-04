/**
 * JSON Schema Validator
 *
 * Validates JSON module definition files for the frontend generator.
 * Note: Backend-specific fields (toNode, relationshipName) are warnings, not errors.
 */

import { JsonModuleDefinition } from "../types/json-schema.interface";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

/**
 * Validate JSON module definition for frontend generation
 *
 * @param schema - JSON module definition
 * @returns Array of validation errors (empty if valid)
 */
export function validateJsonSchema(schema: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  const required = ["moduleName", "endpointName", "targetDir"];
  for (const field of required) {
    if (!schema[field]) {
      errors.push({
        field,
        message: `${field} is required`,
        severity: "error",
      });
    }
  }

  // Module name format (PascalCase)
  if (schema.moduleName && !/^[A-Z][a-zA-Z0-9]*$/.test(schema.moduleName)) {
    errors.push({
      field: "moduleName",
      message: 'Must be PascalCase (e.g., "Comment", "Discussion")',
      severity: "error",
    });
  }

  // Endpoint format (kebab-case plural)
  if (schema.endpointName && !/^[a-z][a-z0-9-]*$/.test(schema.endpointName)) {
    errors.push({
      field: "endpointName",
      message: 'Must be kebab-case (e.g., "comments", "discussions")',
      severity: "error",
    });
  }

  // Target directory validation - must start with "features" or "foundations"
  if (schema.targetDir) {
    const baseDir = schema.targetDir.split("/")[0];
    if (!["features", "foundations"].includes(baseDir)) {
      errors.push({
        field: "targetDir",
        message: 'Must start with "features" or "foundations"',
        severity: "error",
      });
    }
  }

  // Module ID validation (required for frontend)
  if (!schema.moduleId) {
    errors.push({
      field: "moduleId",
      message: "moduleId is required for frontend module registration",
      severity: "error",
    });
  } else if (!/^[a-f0-9-]{36}$/i.test(schema.moduleId)) {
    errors.push({
      field: "moduleId",
      message: "moduleId must be a valid UUID",
      severity: "warning",
    });
  }

  // Fields validation
  if (schema.fields && Array.isArray(schema.fields)) {
    schema.fields.forEach((field: any, index: number) => {
      if (!field.name) {
        errors.push({
          field: `fields[${index}].name`,
          message: "Field name is required",
          severity: "error",
        });
      }

      if (!field.type) {
        errors.push({
          field: `fields[${index}].type`,
          message: "Field type is required",
          severity: "error",
        });
      }

      if (field.nullable === undefined) {
        errors.push({
          field: `fields[${index}].nullable`,
          message: "Field nullable flag is required",
          severity: "error",
        });
      }

      // Validate known types
      const validTypes = ["string", "number", "boolean", "date", "any"];
      if (field.type && !validTypes.includes(field.type)) {
        errors.push({
          field: `fields[${index}].type`,
          message: `Unknown type "${field.type}". Valid types: ${validTypes.join(", ")}`,
          severity: "warning",
        });
      }
    });
  }

  // Relationships validation
  if (schema.relationships && Array.isArray(schema.relationships)) {
    schema.relationships.forEach((rel: any, index: number) => {
      if (!rel.name) {
        errors.push({
          field: `relationships[${index}].name`,
          message: "Relationship name is required",
          severity: "error",
        });
      }

      if (!rel.directory) {
        errors.push({
          field: `relationships[${index}].directory`,
          message: "Relationship directory is required",
          severity: "error",
        });
      }

      // Directory should be features, foundations, or @foundation (for package imports)
      if (rel.directory && !["features", "foundations", "@foundation"].includes(rel.directory) && !rel.directory.startsWith("@foundation/")) {
        errors.push({
          field: `relationships[${index}].directory`,
          message: 'Relationship directory should be "features", "foundations", or "@foundation"',
          severity: "warning",
        });
      }

      if (rel.single === undefined) {
        errors.push({
          field: `relationships[${index}].single`,
          message: "Relationship single flag is required",
          severity: "error",
        });
      }

      if (rel.nullable === undefined) {
        errors.push({
          field: `relationships[${index}].nullable`,
          message: "Relationship nullable flag is required",
          severity: "error",
        });
      }

      // Backend-specific fields are warnings only (not used in frontend)
      if (!rel.relationshipName) {
        errors.push({
          field: `relationships[${index}].relationshipName`,
          message: "relationshipName missing (backend-specific, not used in frontend)",
          severity: "warning",
        });
      }

      if (rel.toNode === undefined) {
        errors.push({
          field: `relationships[${index}].toNode`,
          message: "toNode missing (backend-specific, not used in frontend)",
          severity: "warning",
        });
      }
    });
  }

  return errors;
}

/**
 * Format validation errors for display
 *
 * @param errors - Validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return "No validation errors";
  }

  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  const lines: string[] = [];

  if (errorCount > 0) {
    lines.push(`\n❌ ${errorCount} error(s):`);
    errors
      .filter((e) => e.severity === "error")
      .forEach((error) => {
        lines.push(`   • ${error.field}: ${error.message}`);
      });
  }

  if (warningCount > 0) {
    lines.push(`\n⚠️  ${warningCount} warning(s):`);
    errors
      .filter((e) => e.severity === "warning")
      .forEach((error) => {
        lines.push(`   • ${error.field}: ${error.message}`);
      });
  }

  return lines.join("\n");
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  data: JsonModuleDefinition | null;
  errors: string[];
  warnings: string[];
}

/**
 * Validate and parse JSON file from path
 *
 * @param filePath - Path to JSON file
 * @returns Validation result with data, errors, and warnings
 */
export function parseAndValidate(filePath: string): ValidationResult {
  const result: ValidationResult = {
    data: null,
    errors: [],
    warnings: [],
  };

  // Read file
  let content: string;
  try {
    const fs = require("fs");
    if (!fs.existsSync(filePath)) {
      result.errors.push(`File not found: ${filePath}`);
      return result;
    }
    content = fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    result.errors.push(`Failed to read file: ${(e as Error).message}`);
    return result;
  }

  // Parse JSON
  let schema: any;
  try {
    schema = JSON.parse(content);
  } catch (e) {
    result.errors.push(`Invalid JSON: ${(e as Error).message}`);
    return result;
  }

  // Handle array format (for bulk import compatibility)
  if (Array.isArray(schema)) {
    if (schema.length === 0) {
      result.errors.push("JSON array is empty");
      return result;
    }
    if (schema.length > 1) {
      result.warnings.push(
        `JSON file contains ${schema.length} definitions. Only processing the first one.`
      );
    }
    schema = schema[0];
  }

  // Validate
  const validationErrors = validateJsonSchema(schema);

  // Separate errors and warnings
  validationErrors.forEach((ve) => {
    const msg = `${ve.field}: ${ve.message}`;
    if (ve.severity === "error") {
      result.errors.push(msg);
    } else {
      result.warnings.push(msg);
    }
  });

  // Only set data if validation passed
  if (result.errors.length === 0) {
    result.data = schema as JsonModuleDefinition;
  }

  return result;
}

/**
 * Check if validation result passed (no errors)
 */
export function validationPassed(result: ValidationResult): boolean {
  return result.errors.length === 0 && result.data !== null;
}
