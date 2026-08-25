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
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.{test,spec}.{ts,tsx}"],
    silent: true,
    reporters: ["default"],
    onConsoleLog: () => false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/*.d.ts", "src/**/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@/components/ui": path.resolve(__dirname, "./src/shadcnui/ui"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
