import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildOfflineManifest } from "../build-offline-manifest";

async function writeBuild(distDir: string, buildId: string | null, files: string[]) {
  await mkdir(distDir, { recursive: true });
  if (buildId !== null) await writeFile(path.join(distDir, "BUILD_ID"), `${buildId}\n`);
  for (const file of files) {
    const full = path.join(distDir, "static", file);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, "x");
  }
}

describe("buildOfflineManifest", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "nja-offline-manifest-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("returns buildId from <distDir>/BUILD_ID and every file under <distDir>/static as /_next/static/...", async () => {
    const distDir = path.join(root, ".next");
    await writeBuild(distDir, "abc123", [
      "chunks/main.js",
      "css/app.css",
      "abc123/_buildManifest.js",
      "media/font.woff2",
    ]);
    // Files outside static/ are never listed.
    await writeFile(path.join(distDir, "server-only.json"), "{}");

    const manifest = await buildOfflineManifest({ distDir });

    expect(manifest.buildId).toBe("abc123");
    expect([...manifest.assets].sort()).toEqual(
      [
        "/_next/static/abc123/_buildManifest.js",
        "/_next/static/chunks/main.js",
        "/_next/static/css/app.css",
        "/_next/static/media/font.woff2",
      ].sort(),
    );
  });

  it("honours a custom distDir", async () => {
    await writeBuild(path.join(root, ".next"), "default-build", ["chunks/default.js"]);
    const customDir = path.join(root, ".next-e2e-1");
    await writeBuild(customDir, "e2e-build", ["chunks/e2e.js"]);

    const manifest = await buildOfflineManifest({ distDir: customDir });

    expect(manifest).toEqual({ buildId: "e2e-build", assets: ["/_next/static/chunks/e2e.js"] });
  });

  it("next dev (no BUILD_ID): the id comes from the asset list and changes when a chunk changes", async () => {
    const devDir = path.join(root, ".next", "dev");
    await writeBuild(devDir, null, ["chunks/a_111.js", "development/_buildManifest.js"]);

    const first = await buildOfflineManifest({ distDir: devDir });
    const again = await buildOfflineManifest({ distDir: devDir });
    expect(first.buildId).toMatch(/^dev-[0-9a-f]{16}$/);
    expect(again.buildId).toBe(first.buildId);
    expect(first.assets).toEqual(["/_next/static/chunks/a_111.js", "/_next/static/development/_buildManifest.js"]);

    await writeBuild(devDir, null, ["chunks/a_222.js"]);
    const edited = await buildOfflineManifest({ distDir: devDir });
    expect(edited.buildId).not.toBe(first.buildId);
  });
});
