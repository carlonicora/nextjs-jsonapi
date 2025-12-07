import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "core/index": "src/core/index.ts",
      "components/index": "src/components/index.ts",
      "client/index": "src/client/index.ts",
      "server/index": "src/server/index.ts",
      "permissions/index": "src/permissions/index.ts",
      "utils/index": "src/utils/index.ts",
      "shadcnui/index": "src/shadcnui/index.ts",
      "hooks/index": "src/hooks/index.ts",
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
  },
]);
