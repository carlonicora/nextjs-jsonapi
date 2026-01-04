/**
 * Frontend Template Data Interfaces
 *
 * Type definitions for the data passed to templates
 * during frontend module generation.
 */

/**
 * Name transformations for different naming conventions
 */
export interface NameTransforms {
  pascalCase: string; // e.g., "Comment"
  camelCase: string; // e.g., "comment"
  kebabCase: string; // e.g., "comment"
  pluralPascal: string; // e.g., "Comments"
  pluralCamel: string; // e.g., "comments"
  pluralKebab: string; // e.g., "comments"
  titleCase: string; // e.g., "Comment" (for labels)
  pluralTitleCase: string; // e.g., "Comments" (for labels)
}

/**
 * Frontend field representation
 */
export interface FrontendField {
  name: string;
  type: string;
  tsType: string; // TypeScript type
  zodSchema: string; // Zod schema code
  formComponent: FormComponentType;
  nullable: boolean;
  isContentField: boolean; // Indicates BlockNoteEditor
}

/**
 * Form component types
 */
export type FormComponentType = "FormInput" | "FormTextarea" | "BlockNoteEditor" | "Checkbox" | "DatePicker" | "FormInputNumber";

/**
 * Frontend relationship representation
 */
export interface FrontendRelationship {
  name: string; // e.g., "User"
  variant?: string; // e.g., "Author"
  directory: string; // e.g., "foundations"
  single: boolean;
  nullable: boolean;
  isFoundation: boolean; // true if importing from @carlonicora/nextjs-jsonapi/features
  // Derived properties
  formFieldId: string; // e.g., "author" (lowercase variant) or "user"
  formFieldIdPlural: string; // e.g., "topics" for multi-select
  payloadFieldId: string; // e.g., "authorId" or "topicIds"
  selectorComponent: string; // e.g., "UserSelector" or "TopicMultiSelector"
  zodSchema: string; // e.g., "userObjectSchema" or "z.array(entityObjectSchema)"
  importPath: string; // Full import path for selector
  interfaceImportPath: string; // Full import path for interface
  serviceImportPath: string; // Full import path for service
  interfaceName: string; // e.g., "UserInterface"
  modelKebab: string; // e.g., "user"
  fields?: FrontendField[]; // Relationship property fields (stored on edges)
}

/**
 * i18n key structure
 */
export interface I18nKeySet {
  moduleName: string; // e.g., "comment"
  fields: Record<
    string,
    {
      label: string;
      placeholder: string;
      error: string;
    }
  >;
  relationships: Record<
    string,
    {
      label: string;
      placeholder: string;
      error: string;
      list: string;
      fields?: Record<
        string,
        {
          label: string;
          placeholder: string;
          error: string;
        }
      >;
    }
  >;
  type: {
    singular: string;
    plural: string;
    icuPlural: string; // ICU format plural
  };
}

/**
 * Import statement groups
 */
export interface ImportStatements {
  // Related model/interface imports
  models: string[];
  // Selector component imports
  selectors: string[];
  // Library imports (from @carlonicora/nextjs-jsonapi)
  library: string[];
}

/**
 * Complete template data passed to all templates
 */
export interface FrontendTemplateData {
  // Name variations
  names: NameTransforms;

  // Module metadata
  moduleId: string;
  endpoint: string;
  targetDir: string;

  // Parent class detection
  extendsContent: boolean;

  // Field mappings
  fields: FrontendField[];

  // Relationship mappings
  relationships: FrontendRelationship[];

  // i18n keys
  i18nKeys: I18nKeySet;

  // Import statements
  imports: ImportStatements;

  // For table structure
  tableFieldNames: string[];

  // For service generation
  relationshipServiceMethods: RelationshipServiceMethod[];
}

/**
 * Service method for relationship queries
 */
export interface RelationshipServiceMethod {
  methodName: string; // e.g., "findManyByAuthor"
  paramName: string; // e.g., "authorId"
  relationshipName: string; // e.g., "User"
  relationshipEndpoint: string; // e.g., "users"
}

/**
 * Options for the generator
 */
export interface GenerateWebModuleOptions {
  jsonPath: string;
  dryRun?: boolean;
  force?: boolean;
  noRegister?: boolean;
}

/**
 * Generated file info
 */
export interface GeneratedFile {
  path: string;
  content: string;
  type: "data" | "component" | "context" | "hook" | "module" | "page" | "project-setup";
}
