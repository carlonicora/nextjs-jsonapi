import { readdir, readFile, writeFile } from "fs/promises";
import { defineConfig } from "tsup";

// Client entry points that need "use client" directive
const clientEntries = [
  "dist/atoms/index.mjs",
  "dist/atoms/index.js",
  "dist/hooks/index.mjs",
  "dist/hooks/index.js",
  "dist/components/index.mjs",
  "dist/components/index.js",
  "dist/contexts/index.mjs",
  "dist/contexts/index.js",
  "dist/client/index.mjs",
  "dist/client/index.js",
  "dist/interfaces/index.mjs",
  "dist/interfaces/index.js",
  "dist/shadcnui/index.mjs",
  "dist/shadcnui/index.js",
];

// Patterns that indicate client-only code
const clientCodePatterns = [
  "useFormContext",
  "createContext",
  "useState",
  "useEffect",
  "useCallback",
  "useMemo",
  "useRef",
  "useContext",
  "useReducer",
  "useLayoutEffect",
  "useImperativeHandle",
];

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "atoms/index": "src/atoms/index.ts",
    "core/index": "src/core/index.ts",
    "components/index": "src/components/index.ts",
    "contexts/index": "src/contexts/index.ts",
    "client/index": "src/client/index.ts",
    "interfaces/index": "src/interfaces/index.ts",
    "server/index": "src/server/index.ts",
    "permissions/index": "src/permissions/index.ts",
    "utils/index": "src/utils/index.ts",
    "shadcnui/index": "src/shadcnui/index.ts",
    "hooks/index": "src/hooks/index.ts",
    "features/index": "src/features/index.ts",
    "roles/index": "src/roles/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    "@tanstack/react-table",
    "react",
    "react-dom",
    "next",
    "next/headers",
    "next/cache",
    "next/dist/server/use-cache/cache-life",
    "next/dist/server/use-cache/cache-tag",
    "cookies-next",
    "next-intl",
    "react-hook-form",
    "next-themes",
  ],
  esbuildOptions(options) {
    options.keepNames = true;
    options.jsx = "automatic";
  },
  // Add "use client" to entry files and chunks containing React hooks
  onSuccess: async () => {
    // Add to client entry files
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

    // Add to chunks containing client-only code
    const distFiles = await readdir("dist");
    const chunkFiles = distFiles.filter((f) => f.startsWith("chunk-") && (f.endsWith(".mjs") || f.endsWith(".js")));

    for (const chunkFile of chunkFiles) {
      const filePath = `dist/${chunkFile}`;
      try {
        const content = await readFile(filePath, "utf-8");
        const hasClientCode = clientCodePatterns.some((pattern) => content.includes(pattern));
        if (hasClientCode && !content.startsWith('"use client"')) {
          await writeFile(filePath, `"use client";\n${content}`);
        }
      } catch {
        // Skip if file can't be read
      }
    }
  },
});
