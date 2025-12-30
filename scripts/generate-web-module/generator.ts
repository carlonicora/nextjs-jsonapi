/**
 * Frontend Module Generator
 *
 * Main orchestrator for generating frontend modules from JSON schema.
 */

import * as fs from "fs";
import * as path from "path";
import {
  JsonModuleDefinition,
  FrontendTemplateData,
  GeneratedFile,
  GenerateWebModuleOptions,
} from "./types";
import { transformNames, toCamelCase, pluralize, toTitleCase } from "./transformers/name-transformer";
import { detectExtendsContent } from "./transformers/parent-detector";
import { mapFields, filterInheritedFields } from "./transformers/field-mapper";
import { resolveRelationships, generateServiceMethods } from "./transformers/relationship-resolver";
import { buildImportStatements, buildFilePaths } from "./transformers/import-resolver";
import { generateI18nKeys } from "./transformers/i18n-generator";
import { parseAndValidate, validationPassed } from "./validators/json-schema-validator";
import {
  generateInterfaceTemplate,
  generateModelTemplate,
  generateServiceTemplate,
  generateFieldsTemplate,
  generateEditorTemplate,
  generateDeleterTemplate,
  generateSelectorTemplate,
  generateMultiSelectorTemplate,
  generateListTemplate,
  generateDetailsTemplate,
  generateContentTemplate,
  generateContainerTemplate,
  generateListContainerTemplate,
  generateContextTemplate,
  generateTableHookTemplate,
  generateModuleTemplate,
  generateListPageTemplate,
  generateDetailPageTemplate,
  generateBootstrapperTemplate,
  generateEnvTemplate,
  generateMiddlewareEnvTemplate,
  generateMainLayoutTemplate,
  generateSettingsContextTemplate,
  generateSettingsContainerTemplate,
  generateSettingsPageTemplate,
  generateSettingsModulePageTemplate,
} from "./templates";
import { writeFiles, printResults, updateBootstrapper, updateI18n } from "./utils";

/**
 * Generate all frontend module files from JSON schema
 *
 * @param options - Generator options
 * @returns True if generation succeeded
 */
export async function generateWebModule(options: GenerateWebModuleOptions): Promise<boolean> {
  const { jsonPath, dryRun = false, force = false, noRegister = false } = options;

  console.log(`\n🔧 Frontend Module Generator`);
  console.log(`   JSON Schema: ${jsonPath}`);
  console.log(`   Dry Run: ${dryRun}`);
  console.log(`   Force: ${force}`);
  console.log(`   No Register: ${noRegister}`);

  // Step 1: Validate JSON schema
  console.log("\n📋 Validating JSON schema...");
  const validation = parseAndValidate(jsonPath);

  if (!validationPassed(validation)) {
    console.error("\n❌ Validation failed:");
    validation.errors.forEach((e) => console.error(`   - ${e}`));
    return false;
  }

  if (validation.warnings.length > 0) {
    console.log("\n⚠️  Validation warnings (non-blocking):");
    validation.warnings.forEach((w) => console.log(`   - ${w}`));
  }

  const schema = validation.data!;
  console.log(`   ✅ Schema valid: ${schema.moduleName}`);

  // Step 2: Build template data
  console.log("\n🔨 Building template data...");
  const templateData = buildTemplateData(schema);
  console.log(`   Module: ${templateData.names.pascalCase}`);
  console.log(`   Target: ${templateData.targetDir}`);
  console.log(`   Extends Content: ${templateData.extendsContent}`);
  console.log(`   Fields: ${templateData.fields.length}`);
  console.log(`   Relationships: ${templateData.relationships.length}`);

  // Step 3: Generate all files
  console.log("\n📝 Generating files...");
  const files = generateAllFiles(templateData, schema);
  console.log(`   Generated ${files.length} file templates`);

  // Step 4: Determine web base path
  const webBasePath = findWebBasePath(jsonPath);
  if (!webBasePath) {
    console.error("\n❌ Could not determine web app base path");
    return false;
  }
  console.log(`   Web base path: ${webBasePath}`);

  // Step 5: Write files
  console.log("\n💾 Writing files...");
  const results = writeFiles(files, { dryRun, force });
  printResults(results);

  // Step 6: Update Bootstrapper (unless --no-register)
  if (!noRegister) {
    console.log("\n🔧 Updating Bootstrapper.ts...");
    const bootstrapResult = updateBootstrapper(templateData, webBasePath, dryRun);
    console.log(`   ${bootstrapResult.success ? "✅" : "❌"} ${bootstrapResult.message}`);
  }

  // Step 7: Update i18n for all languages (unless --no-register)
  if (!noRegister) {
    const languages = schema.languages || ["en"];
    console.log(`\n🌐 Updating i18n for ${languages.length} language(s)...`);
    for (const language of languages) {
      const i18nResult = updateI18n(templateData, webBasePath, language, dryRun);
      console.log(`   ${i18nResult.success ? "✅" : "❌"} ${i18nResult.message}`);
    }
  }

  console.log("\n✅ Generation complete!");

  if (dryRun) {
    console.log("\n📝 This was a dry run. No files were actually written.");
    console.log("   Remove --dry-run to generate files.");
  }

  return true;
}

/**
 * Build template data from JSON schema
 */
function buildTemplateData(schema: JsonModuleDefinition): FrontendTemplateData {
  const names = transformNames(schema.moduleName, schema.endpointName);
  const targetDir = schema.targetDir as "features" | "foundations";
  const extendsContent = detectExtendsContent(schema.fields, schema.extendsContent);

  // Map fields
  const allFields = mapFields(schema.fields, names.camelCase);

  // Get inherited fields to filter out for forms (Content fields are handled specially)
  const inheritedFields = extendsContent ? ["name", "tldr", "abstract", "content"] : [];
  const fields = filterInheritedFields(allFields, inheritedFields);

  // Resolve relationships
  const relationships = resolveRelationships(schema.relationships);
  const relationshipServiceMethods = generateServiceMethods(relationships);

  // Build imports
  const imports = buildImportStatements(relationships, extendsContent);

  // Generate i18n keys
  const i18nKeys = generateI18nKeys(names, fields, relationships);

  // Build table field names
  const tableFieldNames = buildTableFieldNames(schema, extendsContent);

  return {
    names,
    moduleId: schema.moduleId,
    endpoint: schema.endpointName,
    targetDir,
    extendsContent,
    fields: allFields, // Keep all fields for interface generation
    relationships,
    i18nKeys,
    imports,
    tableFieldNames,
    relationshipServiceMethods,
  };
}

/**
 * Build field names for table display
 */
function buildTableFieldNames(schema: JsonModuleDefinition, extendsContent: boolean): string[] {
  const fieldNames: string[] = [`${toCamelCase(schema.moduleName)}Id`];

  // Add name for all modules
  fieldNames.push("name");

  // Add authors for content modules
  if (extendsContent) {
    fieldNames.push("authors");
  }

  // Add custom fields (excluding certain ones)
  schema.fields.forEach((f) => {
    if (!["id", "name", "tldr", "abstract", "content", "createdAt", "updatedAt"].includes(f.name)) {
      fieldNames.push(f.name);
    }
  });

  // Add standard date fields
  fieldNames.push("createdAt", "updatedAt");

  return fieldNames;
}

/**
 * Generate all module files
 */
function generateAllFiles(data: FrontendTemplateData, schema: JsonModuleDefinition): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const paths = buildFilePaths(data, findWebBasePath(""));

  // Data layer (4 files)
  files.push({
    path: paths.interface,
    content: generateInterfaceTemplate(data),
    type: "data",
  });

  files.push({
    path: paths.model,
    content: generateModelTemplate(data),
    type: "data",
  });

  files.push({
    path: paths.service,
    content: generateServiceTemplate(data),
    type: "data",
  });

  files.push({
    path: paths.fields,
    content: generateFieldsTemplate(data),
    type: "data",
  });

  // Form components (4 files)
  files.push({
    path: paths.editor,
    content: generateEditorTemplate(data),
    type: "component",
  });

  files.push({
    path: paths.deleter,
    content: generateDeleterTemplate(data),
    type: "component",
  });

  files.push({
    path: paths.selector,
    content: generateSelectorTemplate(data),
    type: "component",
  });

  files.push({
    path: paths.multiSelector,
    content: generateMultiSelectorTemplate(data),
    type: "component",
  });

  // Display components (4-5 files)
  files.push({
    path: paths.list,
    content: generateListTemplate(data),
    type: "component",
  });

  files.push({
    path: paths.details,
    content: generateDetailsTemplate(data),
    type: "component",
  });

  // Content component only for Content-extending modules
  const contentTemplate = generateContentTemplate(data);
  if (contentTemplate) {
    files.push({
      path: paths.content,
      content: contentTemplate,
      type: "component",
    });
  }

  files.push({
    path: paths.container,
    content: generateContainerTemplate(data),
    type: "component",
  });

  files.push({
    path: paths.listContainer,
    content: generateListContainerTemplate(data),
    type: "component",
  });

  // Context & hooks (2 files)
  files.push({
    path: paths.context,
    content: generateContextTemplate(data),
    type: "context",
  });

  files.push({
    path: paths.tableHook,
    content: generateTableHookTemplate(data),
    type: "hook",
  });

  // Module (1 file)
  files.push({
    path: paths.module,
    content: generateModuleTemplate(data),
    type: "module",
  });

  // Pages (2 files)
  files.push({
    path: paths.listPage,
    content: generateListPageTemplate(data),
    type: "page",
  });

  files.push({
    path: paths.detailPage,
    content: generateDetailPageTemplate(data),
    type: "page",
  });

  // Project setup files (only if they don't exist)
  const webBasePath = findWebBasePath("");

  const bootstrapper = generateBootstrapperTemplate(webBasePath);
  if (bootstrapper) {
    files.push({
      path: path.join(webBasePath, "apps/web/src/config/Bootstrapper.ts"),
      content: bootstrapper,
      type: "project-setup",
    });
  }

  const env = generateEnvTemplate(webBasePath);
  if (env) {
    files.push({
      path: path.join(webBasePath, "apps/web/src/config/env.ts"),
      content: env,
      type: "project-setup",
    });
  }

  const middlewareEnv = generateMiddlewareEnvTemplate(webBasePath);
  if (middlewareEnv) {
    files.push({
      path: path.join(webBasePath, "apps/web/src/config/middleware-env.ts"),
      content: middlewareEnv,
      type: "project-setup",
    });
  }

  const mainLayout = generateMainLayoutTemplate(webBasePath);
  if (mainLayout) {
    files.push({
      path: path.join(webBasePath, "apps/web/src/app/[locale]/(main)/layout.tsx"),
      content: mainLayout,
      type: "project-setup",
    });
  }

  const settingsContext = generateSettingsContextTemplate(webBasePath);
  if (settingsContext) {
    files.push({
      path: path.join(webBasePath, "apps/web/src/features/common/contexts/SettingsContext.tsx"),
      content: settingsContext,
      type: "project-setup",
    });
  }

  const settingsContainer = generateSettingsContainerTemplate(webBasePath);
  if (settingsContainer) {
    files.push({
      path: path.join(webBasePath, "apps/web/src/features/common/components/containers/SettingsContainer.tsx"),
      content: settingsContainer,
      type: "project-setup",
    });
  }

  const settingsPage = generateSettingsPageTemplate(webBasePath);
  if (settingsPage) {
    files.push({
      path: path.join(webBasePath, "apps/web/src/app/[locale]/(main)/(features)/settings/page.tsx"),
      content: settingsPage,
      type: "project-setup",
    });
  }

  const settingsModulePage = generateSettingsModulePageTemplate(webBasePath);
  if (settingsModulePage) {
    files.push({
      path: path.join(webBasePath, "apps/web/src/app/[locale]/(main)/(features)/settings/[module]/page.tsx"),
      content: settingsModulePage,
      type: "project-setup",
    });
  }

  return files;
}

/**
 * Find the web app base path from the JSON path
 * Assumes JSON is in /structure folder and web app is in /apps/web
 */
function findWebBasePath(jsonPath: string): string {
  // Try to find apps/web relative to current working directory
  const cwd = process.cwd();

  // Check if we're in the monorepo root
  if (fs.existsSync(path.join(cwd, "apps/web"))) {
    return cwd;
  }

  // Check if we're in packages/nextjs-jsonapi
  if (fs.existsSync(path.join(cwd, "../../apps/web"))) {
    return path.join(cwd, "../..");
  }

  // Try to derive from jsonPath
  if (jsonPath) {
    const resolved = path.resolve(jsonPath);
    // Look for monorepo root by finding apps/web
    let current = path.dirname(resolved);
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync(path.join(current, "apps/web"))) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  // Default to current directory
  return cwd;
}

export default generateWebModule;
