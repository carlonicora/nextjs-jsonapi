import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "core/index": "src/core/index.ts",
      "client/index": "src/client/index.ts",
      "server/index": "src/server/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
      "react",
      "react-dom",
      "next",
      "next/headers",
      "next/cache",
      "next/dist/server/use-cache/cache-life",
      "next/dist/server/use-cache/cache-tag",
      "cookies-next",
    ],
    esbuildOptions(options) {
      options.keepNames = true;
    },
  },
]);
