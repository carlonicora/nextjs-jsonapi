/**
 * JSON Schema Interfaces
 *
 * Type definitions for the JSON module definition files
 * located in the /structure folder.
 * Copied from backend generator - shared schema format.
 */

/**
 * Field definition in JSON schema
 */
export interface JsonFieldDefinition {
  name: string;
  type: string;
  nullable: boolean;
}

/**
 * Relationship definition in JSON schema
 */
export interface JsonRelationshipDefinition {
  name: string;
  variant?: string;
  directory: string;
  single: boolean;
  relationshipName: string; // Backend-specific, ignored in frontend
  toNode: boolean; // Backend-specific, ignored in frontend
  nullable: boolean;
  fields?: JsonFieldDefinition[]; // Relationship property fields (stored on edges)
}

/**
 * Complete module definition from JSON
 */
export interface JsonModuleDefinition {
  moduleId: string;
  moduleName: string;
  endpointName: string;
  targetDir: string;
  languages: string[];
  fields: JsonFieldDefinition[];
  relationships: JsonRelationshipDefinition[];
  /** Explicitly set whether this module extends Content. If not set, auto-detects based on fields. */
  extendsContent?: boolean;
}
