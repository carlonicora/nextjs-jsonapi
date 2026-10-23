import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Headroom for the monorepo-wide `pnpm test`, where turbo runs every
    // package's suite at once and this jsdom suite competes with two Node
    // suites for CPU. Vitest's 5s default is a wall-clock budget, so a
    // `userEvent.click` that resolves in ~750ms standalone (measured on
    // RecentPagesNavigator) can blow it purely from scheduling delay — a
    // failure that says nothing about the code under test. Matches the values
    // the consuming app's own vitest.config.ts already carries.
    testTimeout: 15000,
    hookTimeout: 30000,
    include: ["src/**/*.spec.{ts,tsx}", "scripts/**/*.spec.{ts,tsx}"],
    silent: true,
    // default output unchanged; the slow-test list is appended (report only).
    reporters: ["default", "./vitest.slow-tests.reporter.ts"],
    onConsoleLog: () => false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.spec.{ts,tsx}", "src/**/*.d.ts", "src/**/index.ts"],
    },
  },
  resolve: {
    alias: {
      // Self-reference used by the analytics server pages (see tsup.config.ts).
      "@carlonicora/nextjs-jsonapi/analytics": path.resolve(__dirname, "./src/features/analytics/index.ts"),
      // Self-reference used by BlockNoteServerContent (see tsup.config.ts).
      "@carlonicora/nextjs-jsonapi/components": path.resolve(__dirname, "./src/components/index.ts"),
      // Self-reference used by serverRequest (see package.json "./cached-get").
      "@carlonicora/nextjs-jsonapi/cached-get": path.resolve(__dirname, "./src/server/cachedGet.ts"),
      "@/components/ui": path.resolve(__dirname, "./src/shadcnui/ui"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
