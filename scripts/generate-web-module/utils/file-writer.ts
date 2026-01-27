/**
 * File Writer Utility
 *
 * Handles file writing with conflict detection and directory creation.
 */

import * as fs from "fs";
import * as path from "path";
import { GeneratedFile } from "../types/template-data.interface";

export interface WriteOptions {
  dryRun?: boolean;
  force?: boolean;
}

export interface WriteResult {
  path: string;
  status: "created" | "updated" | "skipped" | "dry-run";
  existed: boolean;
}

/**
 * Write a single file to disk
 *
 * @param file - Generated file data
 * @param options - Write options
 * @returns Write result
 */
export function writeFile(file: GeneratedFile, options: WriteOptions = {}): WriteResult {
  const { dryRun = false, force = false } = options;
  const existed = fs.existsSync(file.path);

  if (dryRun) {
    return {
      path: file.path,
      status: "dry-run",
      existed,
    };
  }

  // Check if file exists and we're not forcing
  if (existed && !force) {
    return {
      path: file.path,
      status: "skipped",
      existed: true,
    };
  }

  // Create directory if needed
  const dir = path.dirname(file.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(file.path, file.content, "utf-8");

  return {
    path: file.path,
    status: existed ? "updated" : "created",
    existed,
  };
}

/**
 * Write multiple files to disk
 *
 * @param files - Array of generated files
 * @param options - Write options
 * @returns Array of write results
 */
export function writeFiles(files: GeneratedFile[], options: WriteOptions = {}): WriteResult[] {
  return files.map((file) => writeFile(file, options));
}

/**
 * Print write results to console
 *
 * @param results - Array of write results
 */
export function printResults(results: WriteResult[]): void {
  const grouped = {
    created: results.filter((r) => r.status === "created"),
    updated: results.filter((r) => r.status === "updated"),
    skipped: results.filter((r) => r.status === "skipped"),
    dryRun: results.filter((r) => r.status === "dry-run"),
  };

  if (grouped.dryRun.length > 0) {
    console.info("\n📋 DRY RUN - Files that would be created:");
    grouped.dryRun.forEach((r) => {
      console.info(`   ${r.existed ? "🔄" : "✨"} ${r.path}`);
    });
  }

  if (grouped.created.length > 0) {
    console.info("\n✨ Created files:");
    grouped.created.forEach((r) => console.info(`   ${r.path}`));
  }

  if (grouped.updated.length > 0) {
    console.info("\n🔄 Updated files:");
    grouped.updated.forEach((r) => console.info(`   ${r.path}`));
  }

  if (grouped.skipped.length > 0) {
    console.info("\n⏭️  Skipped (already exist, use --force to overwrite):");
    grouped.skipped.forEach((r) => console.info(`   ${r.path}`));
  }

  console.info(
    `\nTotal: ${results.length} files (${grouped.created.length} created, ${grouped.updated.length} updated, ${grouped.skipped.length} skipped)`
  );
}
