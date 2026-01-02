import { readFile, writeFile } from "fs/promises";
import { defineConfig } from "tsup";

// Client entry points that need "use client" directive
const clientEntries = [
  "dist/client/index.mjs",
  "dist/client/index.js",
  "dist/components/index.mjs",
  "dist/components/index.js",
  "dist/contexts/index.mjs",
  "dist/contexts/index.js",
  "dist/testing/index.mjs",
  "dist/testing/index.js",
];

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "server/index": "src/server/index.ts",
    "client/index": "src/client/index.ts",
    "components/index": "src/components/index.ts",
    "contexts/index": "src/contexts/index.ts",
    "testing/index": "src/testing/index.ts",
  },
  format: ["cjs", "esm"],
  // Enable splitting to keep dynamic imports as separate chunks
  // This prevents server code (with "use cache") from being inlined into client bundles
  splitting: true,
  sourcemap: true,
  clean: true,
  // Bundle type generation with resolution
  dts: { resolve: true },
  external: [
    "@tanstack/react-table",
    "@stripe/react-stripe-js",
    "@stripe/stripe-js",
    "react",
    "react-dom",
    "next",
    "next/headers",
    "next/cache",
    "next/dist/server/use-cache/cache-life",
    "next/dist/server/use-cache/cache-tag",
    "cookies-next",
    "next-intl",
    "next-intl/server",
    "react-hook-form",
    "next-themes",
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
  },
});
