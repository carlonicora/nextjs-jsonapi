import { readFile, writeFile } from "fs/promises";
import path from "path";
import { defineConfig, type Options } from "tsup";
import { DEVICE_WORKER_FILE, OFFLINE_SQLITE_FILES } from "./src/offline/types";

// Client entry points that need "use client" directive
const clientEntries = [
  "dist/client/index.mjs",
  "dist/client/index.js",
  "dist/components/index.mjs",
  "dist/components/index.js",
  "dist/contexts/index.mjs",
  "dist/contexts/index.js",
  "dist/date-locale/index.mjs",
  "dist/date-locale/index.js",
  "dist/testing/index.mjs",
  "dist/testing/index.js",
  "dist/billing/index.mjs",
  "dist/billing/index.js",
  "dist/email-automations/index.mjs",
  "dist/email-automations/index.js",
  "dist/features/help/index.mjs",
  "dist/features/help/index.js",
  "dist/features/blog/index.mjs",
  "dist/features/blog/index.js",
  "dist/features/tokenusage/index.mjs",
  "dist/features/tokenusage/index.js",
  "dist/features/analytics/index.mjs",
  "dist/features/analytics/index.js",
  "dist/offline/index.mjs",
  "dist/offline/index.js",
];

const entries: Record<string, string> = {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "server/index": "src/server/index.ts",
    "client/index": "src/client/index.ts",
    "offline/index": "src/offline/index.ts",
    "components/index": "src/components/index.ts",
    "components/editors/server": "src/components/editors/server-entry.ts",
    "contexts/index": "src/contexts/index.ts",
    "date-locale/index": "src/date-locale/index.ts",
    "testing/index": "src/testing/index.ts",
    "billing/index": "src/billing/index.ts",
    "email-automations/index": "src/email-automations/index.ts",
    "features/help/index": "src/features/help/index.ts",
    "features/help/server": "src/features/help/server-entry.ts",
    "features/blog/index": "src/features/blog/index.ts",
    "features/blog/server": "src/features/blog/server-entry.ts",
    "features/tokenusage/index": "src/features/tokenusage/index.ts",
    "features/analytics/index": "src/features/analytics/index.ts",
    "features/analytics/server": "src/features/analytics/server-entry.ts",
    // The "use cache" GET and its stub, resolved by condition through "./cached-get".
    "server/cachedGet": "src/server/cachedGet.ts",
    "server/cachedGet.stub": "src/server/cachedGet.stub.ts",
    // Loaded by each app's next.config.js through `require`; Node built-ins only.
    "next-config/index": "src/next-config/index.ts",
};

const mainConfig: Options = {
  entry: entries,
  format: ["cjs", "esm"],
  // Enable splitting to keep dynamic imports as separate chunks
  // This prevents server code (with "use cache") from being inlined into client bundles
  splitting: true,
  sourcemap: true,
  // clean is done once by the `build` npm script (`rm -rf dist`) rather than by
  // tsup itself. The dev launcher (`turbo run dev`) runs this package's `build`
  // and `dev` (tsup --watch) tasks; if both let tsup clean the shared dist/,
  // their `removeFiles` passes race and one crashes with ENOENT on unlink.
  // With clean:false the watch never wipes dist/, so the apps (which wait only
  // on `build`) always see a valid dist/. See turbo.json (dev dependsOn build).
  clean: false,
  // Declarations are emitted by tsc, one .d.ts per source file
  // (scripts/build-types.mjs). tsup's bundled dts pass needed an 8 GB heap and
  // still ran out; tsc needs about 1 GB.
  dts: false,
  external: [
    "@tanstack/react-table",
    "@stripe/react-stripe-js",
    "@stripe/stripe-js",
    "@xyflow/react",
    "react",
    "react-dom",
    "next",
    "next/headers",
    "next/cache",
    // The analytics server pages import their client containers through this
    // package's own client subpath. Keeping it external is what makes the built
    // server entry reach them through the "use client" bundle instead of
    // inlining client code into a server module.
    "@carlonicora/nextjs-jsonapi/analytics",
    // Same for BlockNoteServerContent, which renders the "use client"
    // BlockNoteStaticViewer through the components subpath.
    "@carlonicora/nextjs-jsonapi/components",
    // serverRequest imports the cached GET through this package's own export so the
    // `react-server` condition can swap in a stub for client bundles (package.json).
    "@carlonicora/nextjs-jsonapi/cached-get",
    "cookies-next",
    "next-intl",
    "next-intl/server",
    "react-hook-form",
    "next-themes",
    "jotai",
    "jotai/utils",
    "jotai/react",
    "jotai-family",
    // Test dependencies (for /testing export)
    "vitest",
    "@testing-library/react",
    "@testing-library/dom",
    "@testing-library/jest-dom",
    "@testing-library/user-event",
  ],
  esbuildOptions(options) {
    options.keepNames = true;
    options.jsx = "automatic";
    // Add alias resolution for @/ path imports
    options.alias = {
      "@/lib/utils": path.resolve(__dirname, "src/lib/utils"),
      "@/hooks/use-mobile": path.resolve(__dirname, "src/hooks/use-mobile"),
      "@/components/ui": path.resolve(__dirname, "src/shadcnui/ui"),
    };
  },
  // Add "use client" to client entry files
  onSuccess: async () => {
    for (const file of clientEntries) {
      try {
        const content = await readFile(file, "utf-8");
        if (!content.startsWith('"use client"')) {
          await writeFile(file, `"use client";\n${content}`);
        }
      } catch {
        // File might not exist (e.g., if format doesn't include it)
      }
    }
    await copyOfflineSqliteFiles();
  },
};

// The device worker loads SQLite at run time instead of bundling it (OfflineConfig.sqliteModuleUrl):
// these files ship in dist/offline/sqlite/ for the app to serve, at the version this package pins.
// The device worker itself lands in the same folder (deviceWorker config below).
async function copyOfflineSqliteFiles(): Promise<void> {
  const { copyFile, mkdir } = await import("fs/promises");
  const { createRequire } = await import("module");
  const resolve = createRequire(path.join(__dirname, "package.json")).resolve;
  const source = path.join(path.dirname(resolve("@sqlite.org/sqlite-wasm/package.json")), "dist");
  const target = path.resolve(__dirname, "dist/offline/sqlite");
  await mkdir(target, { recursive: true });
  for (const file of OFFLINE_SQLITE_FILES.filter((name) => name !== DEVICE_WORKER_FILE)) {
    await copyFile(path.join(source, file), path.join(target, file));
  }
}

// The device-copy Web Worker, built as ONE standalone ES module next to the SQLite files
// (dist/offline/sqlite/device-worker.mjs) and started from a plain URL
// (OfflineConfig.deviceWorkerUrl). It is never handed to the app's bundler: Turbopack wraps a
// `new Worker(new URL(...))` in a launcher whose `#params=` URL fragment a service-worker cache
// answer drops, so the worker could not start offline.
const deviceWorker: Options = {
  entry: { [`offline/sqlite/${DEVICE_WORKER_FILE.replace(/\.mjs$/, "")}`]: "src/offline/store/worker.ts" },
  format: ["esm"],
  outExtension: () => ({ js: ".mjs" }),
  splitting: false,
  sourcemap: false,
  clean: false,
  dts: false,
  esbuildOptions: mainConfig.esbuildOptions,
};

export default defineConfig([mainConfig, deviceWorker]);
