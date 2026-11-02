import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type OfflineManifest = { buildId: string; assets: string[] };

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

/**
 * Describes the running build for the service worker's offline shell precache
 * (`/offline-manifest.json`): the build id from `<distDir>/BUILD_ID` and every
 * file under `<distDir>/static`, as the `/_next/static/...` URL Next serves it at.
 * `next dev` writes no BUILD_ID (its folder is `.next/dev`): the id is then derived from the
 * asset list, whose chunk names carry content hashes, so an edit gives a new id and the
 * service worker refreshes the shell.
 * `distDir` must be the value the app's next.config uses. `extraAssets` are further same-origin
 * URLs the shell needs with no network (the SQLite files the device worker loads).
 */
export async function buildOfflineManifest(params: {
  distDir: string;
  extraAssets?: string[];
}): Promise<OfflineManifest> {
  const staticDir = path.join(params.distDir, "static");
  const files = await listFiles(staticDir);
  const assets = files
    .map((file) => `/_next/static/${path.relative(staticDir, file).split(path.sep).join("/")}`)
    .concat(params.extraAssets ?? [])
    .sort();
  const buildId = await readBuildId(params.distDir, assets);
  return { buildId, assets };
}

async function readBuildId(distDir: string, assets: string[]): Promise<string> {
  try {
    return (await readFile(path.join(distDir, "BUILD_ID"), "utf8")).trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return `dev-${createHash("sha256").update(assets.join("\n")).digest("hex").slice(0, 16)}`;
  }
}
