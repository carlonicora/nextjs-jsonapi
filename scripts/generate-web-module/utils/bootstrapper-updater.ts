/**
 * Bootstrapper Updater
 *
 * Updates the Bootstrapper.ts file to register new modules.
 */

import * as fs from "fs";
import { FrontendTemplateData } from "../types/template-data.interface";

const BOOTSTRAPPER_PATH = "apps/web/src/config/Bootstrapper.ts";

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

export interface BootstrapperUpdateResult {
  success: boolean;
  message: string;
  alreadyRegistered?: boolean;
}

/**
 * Update Bootstrapper.ts to add a new module
 *
 * @param data - Frontend template data
 * @param webBasePath - Base path to web app
 * @param dryRun - Whether to perform a dry run
 * @returns Update result
 */
export function updateBootstrapper(
  data: FrontendTemplateData,
  webBasePath: string,
  dryRun: boolean = false
): BootstrapperUpdateResult {
  const { names, targetDir } = data;
  const bootstrapperPath = `${webBasePath}/${BOOTSTRAPPER_PATH}`;

  // Check if file exists
  if (!fs.existsSync(bootstrapperPath)) {
    return {
      success: false,
      message: `Bootstrapper.ts not found at ${bootstrapperPath}`,
    };
  }

  let content = fs.readFileSync(bootstrapperPath, "utf-8");

  // Check if module is already registered
  const modulePattern = new RegExp(`${names.pascalCase}Module`, "g");
  if (modulePattern.test(content)) {
    return {
      success: true,
      message: `Module ${names.pascalCase} already registered in Bootstrapper.ts`,
      alreadyRegistered: true,
    };
  }

  // Add import statement
  const subdir = getSubdirectoryPath(targetDir);
  const subdirPath = subdir ? `${subdir}/` : "";
  const importStatement = `import { ${names.pascalCase}Module } from "@/features/${subdirPath}${names.kebabCase}/${names.pascalCase}Module";`;

  // Find the right place to insert import (after "// Feature module imports" or at end of imports)
  const featureImportsMarker = "// Feature module imports";
  const lastImportMatch = content.match(/^import .* from ".*";$/gm);

  if (content.includes(featureImportsMarker)) {
    // Find the last import after the marker
    const markerIndex = content.indexOf(featureImportsMarker);
    const afterMarker = content.substring(markerIndex);
    const nextNewlineIndex = afterMarker.indexOf("\n");
    const insertPosition = markerIndex + nextNewlineIndex;

    // Find next empty line or start of const
    const afterMarkerContent = content.substring(insertPosition);
    const constIndex = afterMarkerContent.indexOf("\nconst ");

    if (constIndex > 0) {
      const insertAt = insertPosition + constIndex;
      content = content.slice(0, insertAt) + `\n${importStatement}` + content.slice(insertAt);
    }
  } else if (lastImportMatch) {
    // Insert after last import
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertAt = lastImportIndex + lastImport.length;
    content = content.slice(0, insertAt) + `\n${importStatement}` + content.slice(insertAt);
  }

  // Add module to allModules object
  const allModulesPattern = /const allModules = \{[^}]+\}/s;
  const allModulesMatch = content.match(allModulesPattern);

  if (allModulesMatch) {
    const allModulesBlock = allModulesMatch[0];
    // Find the last line before closing brace
    const lines = allModulesBlock.split("\n");
    const lastEntryIndex = lines.length - 1;

    // Add new module entry before the closing brace
    const newEntry = `  ${names.pascalCase}: ${names.pascalCase}Module(moduleFactory),`;

    // Find if there's a trailing comma on the last entry
    for (let i = lastEntryIndex - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line && !line.startsWith("//")) {
        // Add comma if needed
        if (!line.endsWith(",")) {
          lines[i] = lines[i].replace(/(\s*)$/, ",$1");
        }
        break;
      }
    }

    // Insert new entry
    lines.splice(lastEntryIndex, 0, newEntry);
    const updatedBlock = lines.join("\n");
    content = content.replace(allModulesBlock, updatedBlock);
  }

  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Would update Bootstrapper.ts with ${names.pascalCase}Module`,
    };
  }

  // Write updated content
  fs.writeFileSync(bootstrapperPath, content, "utf-8");

  return {
    success: true,
    message: `Updated Bootstrapper.ts with ${names.pascalCase}Module`,
  };
}

/**
 * Generate the import statement for a module
 */
export function generateImportStatement(data: FrontendTemplateData): string {
  const { names, targetDir } = data;
  const subdir = getSubdirectoryPath(targetDir);
  const subdirPath = subdir ? `${subdir}/` : "";
  return `import { ${names.pascalCase}Module } from "@/features/${subdirPath}${names.kebabCase}/${names.pascalCase}Module";`;
}

/**
 * Generate the module registration entry
 */
export function generateModuleEntry(data: FrontendTemplateData): string {
  const { names } = data;
  return `  ${names.pascalCase}: ${names.pascalCase}Module(moduleFactory),`;
}
