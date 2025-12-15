#!/usr/bin/env node
/**
 * Frontend Module Generator CLI
 *
 * Generates Next.js frontend modules from JSON schema definitions.
 *
 * Usage:
 *   pnpm generate-web-module <json-path> [options]
 *
 * Options:
 *   --dry-run      Preview without writing files
 *   --force        Overwrite existing files
 *   --no-register  Skip Bootstrapper and i18n updates
 */

import { Command } from "commander";
import * as path from "path";
import { generateWebModule } from "./generator";

const program = new Command();

program
  .name("generate-web-module")
  .description("Generate Next.js frontend module from JSON schema")
  .version("1.0.0")
  .argument("<json-path>", "Path to JSON schema file (relative or absolute)")
  .option("-d, --dry-run", "Preview files without writing them", false)
  .option("-f, --force", "Overwrite existing files", false)
  .option("-n, --no-register", "Skip Bootstrapper.ts and i18n updates")
  .action(async (jsonPath: string, options: { dryRun: boolean; force: boolean; register: boolean }) => {
    // Resolve path
    const resolvedPath = path.isAbsolute(jsonPath) ? jsonPath : path.resolve(process.cwd(), jsonPath);

    try {
      const success = await generateWebModule({
        jsonPath: resolvedPath,
        dryRun: options.dryRun,
        force: options.force,
        noRegister: !options.register,
      });

      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error("\n❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
