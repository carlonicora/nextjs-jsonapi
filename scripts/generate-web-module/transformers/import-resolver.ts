/**
 * Import Resolver
 *
 * Builds import paths for selectors, models, and related modules.
 */

import { FrontendRelationship, ImportStatements, FrontendTemplateData } from "../types/template-data.interface";
import { AUTHOR_VARIANT } from "../types/field-mapping.types";
import { toKebabCase, pluralize } from "./name-transformer";

/**
 * Build all import statements needed for a module
 *
 * @param relationships - Array of frontend relationships
 * @param extendsContent - Whether the module extends Content
 * @returns Import statements grouped by category
 */
export function buildImportStatements(
  relationships: FrontendRelationship[],
  extendsContent: boolean
): ImportStatements {
  return {
    models: buildModelImports(relationships),
    selectors: buildSelectorImports(relationships),
    library: buildLibraryImports(extendsContent),
  };
}

/**
 * Build model/interface import statements
 *
 * @param relationships - Array of frontend relationships
 * @returns Array of import statements for models
 */
export function buildModelImports(relationships: FrontendRelationship[]): string[] {
  const imports: string[] = [];

  relationships.forEach((rel) => {
    // Import interface for relationships
    imports.push(
      `import { ${rel.interfaceName} } from "${rel.interfaceImportPath}";`
    );
  });

  return [...new Set(imports)]; // Deduplicate
}

/**
 * Build selector component import statements
 *
 * @param relationships - Array of frontend relationships
 * @returns Array of import statements for selectors
 */
export function buildSelectorImports(relationships: FrontendRelationship[]): string[] {
  const imports: string[] = [];

  relationships.forEach((rel) => {
    // Skip author - handled specially or auto-set
    if (rel.variant === AUTHOR_VARIANT) {
      return;
    }

    // Foundation components use MultiSelect, generated modules use MultiSelector
    const componentName = rel.single
      ? `${rel.name}Selector`
      : (rel.isFoundation ? `${rel.name}MultiSelect` : `${rel.name}MultiSelector`);
    imports.push(
      `import ${componentName} from "${rel.importPath}";`
    );
  });

  return [...new Set(imports)]; // Deduplicate
}

/**
 * Build library import statements
 *
 * @param extendsContent - Whether the module extends Content
 * @returns Array of import statements for library
 */
export function buildLibraryImports(extendsContent: boolean): string[] {
  const imports: string[] = [];

  // Core imports always needed
  imports.push(
    `import { AbstractApiData } from "@carlonicora/nextjs-jsonapi/core";`
  );

  // Content import if extending
  if (extendsContent) {
    imports.push(
      `import { Content, ContentInterface, ContentInput } from "@carlonicora/nextjs-jsonapi/core";`
    );
  }

  return imports;
}

/**
 * Get the subdirectory path from targetDir, stripping the base "features" or "foundations" prefix
 * since the @/features/ alias already provides that base.
 *
 * @param targetDir - Target directory (e.g., "features/customer-management" or "features")
 * @returns Subdirectory path (e.g., "customer-management" or "")
 */
function getSubdirectoryPath(targetDir: string): string {
  const segments = targetDir.split("/");
  // Remove the first segment (features or foundations) since @/features/ already includes it
  return segments.slice(1).join("/");
}

/**
 * Build import path for a module's own files
 *
 * @param targetDir - Target directory
 * @param moduleName - Module name (PascalCase)
 * @param fileName - File name without extension
 * @returns Import path
 */
export function buildModuleImportPath(
  targetDir: string,
  moduleName: string,
  fileName: string
): string {
  const kebab = toKebabCase(moduleName);
  const subdir = getSubdirectoryPath(targetDir);
  const subdirPath = subdir ? `${subdir}/` : "";
  return `@/features/${subdirPath}${kebab}/data/${fileName}`;
}

/**
 * Build import path for a related module's selector
 *
 * @param rel - Frontend relationship
 * @returns Import path for selector
 */
export function buildSelectorImportPath(rel: FrontendRelationship): string {
  const componentName = rel.single ? `${rel.name}Selector` : `${rel.name}MultiSelector`;
  return `@/features/${rel.directory}/${rel.modelKebab}/components/forms/${componentName}`;
}

/**
 * Get the web base path for generated files
 *
 * @param targetDir - Target directory (e.g., "features/customer-management" or "features")
 * @param moduleName - Module name (PascalCase)
 * @returns Base path for generated files
 */
export function getWebBasePath(targetDir: string, moduleName: string): string {
  const kebab = toKebabCase(moduleName);
  const subdir = getSubdirectoryPath(targetDir);
  const subdirPath = subdir ? `${subdir}/` : "";
  return `apps/web/src/features/${subdirPath}${kebab}`;
}

/**
 * Get the page path for generated pages
 *
 * @param pluralKebab - Plural kebab-case name (e.g., "comments")
 * @returns Base path for page files
 */
export function getPageBasePath(pluralKebab: string): string {
  return `apps/web/src/app/[locale]/(main)/(features)/${pluralKebab}`;
}

/**
 * File paths interface
 */
export interface ModuleFilePaths {
  interface: string;
  model: string;
  service: string;
  fields: string;
  editor: string;
  deleter: string;
  selector: string;
  multiSelector: string;
  list: string;
  details: string;
  content: string;
  container: string;
  listContainer: string;
  context: string;
  tableHook: string;
  module: string;
  listPage: string;
  detailPage: string;
}

/**
 * Build all file paths for a module from template data
 *
 * @param data - Frontend template data
 * @param rootPath - Root path for the monorepo (optional, defaults to "")
 * @returns Object with all file paths
 */
export function buildFilePaths(
  data: FrontendTemplateData,
  rootPath: string = ""
): ModuleFilePaths {
  const { names, targetDir } = data;
  const prefix = rootPath ? `${rootPath}/` : "";
  const subdir = getSubdirectoryPath(targetDir);
  const subdirPath = subdir ? `${subdir}/` : "";
  const basePath = `${prefix}apps/web/src/features/${subdirPath}${names.kebabCase}`;
  const pagePath = `${prefix}apps/web/src/app/[locale]/(main)/(features)/${names.pluralKebab}`;

  return {
    // Data layer
    interface: `${basePath}/data/${names.pascalCase}Interface.ts`,
    model: `${basePath}/data/${names.pascalCase}.ts`,
    service: `${basePath}/data/${names.pascalCase}Service.ts`,
    fields: `${basePath}/data/${names.pascalCase}Fields.ts`,

    // Components
    editor: `${basePath}/components/forms/${names.pascalCase}Editor.tsx`,
    deleter: `${basePath}/components/forms/${names.pascalCase}Deleter.tsx`,
    selector: `${basePath}/components/forms/${names.pascalCase}Selector.tsx`,
    multiSelector: `${basePath}/components/forms/${names.pascalCase}MultiSelector.tsx`,
    list: `${basePath}/components/lists/${names.pascalCase}List.tsx`,
    details: `${basePath}/components/details/${names.pascalCase}Details.tsx`,
    content: `${basePath}/components/details/${names.pascalCase}Content.tsx`,
    container: `${basePath}/components/containers/${names.pascalCase}Container.tsx`,
    listContainer: `${basePath}/components/containers/${names.pascalCase}ListContainer.tsx`,

    // Context & Hooks
    context: `${basePath}/contexts/${names.pascalCase}Context.tsx`,
    tableHook: `${basePath}/hooks/use${names.pascalCase}TableStructure.tsx`,

    // Module
    module: `${basePath}/${names.pascalCase}Module.ts`,

    // Pages
    listPage: `${pagePath}/page.tsx`,
    detailPage: `${pagePath}/[id]/page.tsx`,
  };
}

/**
 * Build relative import path between two files
 *
 * @param fromPath - Source file path
 * @param toPath - Target file path
 * @returns Relative import path
 */
export function buildRelativeImport(fromPath: string, toPath: string): string {
  // For files in same feature, use @ alias
  if (toPath.startsWith("@/")) {
    return toPath;
  }

  // Calculate relative path
  const fromParts = fromPath.split("/");
  const toParts = toPath.split("/");

  // Find common prefix
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  // Build relative path
  const upCount = fromParts.length - commonLength - 1; // -1 for the file itself
  const relativeParts = toParts.slice(commonLength);
  const prefix = upCount > 0 ? "../".repeat(upCount) : "./";

  return prefix + relativeParts.join("/");
}
