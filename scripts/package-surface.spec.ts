import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import pkg from "../package.json";

describe("package surface", () => {
  it("ships and exports messages and pwa", () => {
    expect(pkg.files).toEqual(expect.arrayContaining(["messages", "pwa"]));
    expect((pkg.exports as Record<string, unknown>)["./messages/*"]).toBe("./messages/*");
    expect(pkg.scripts.lint).toContain("node scripts/validate-messages.mjs");
  });
  it("messages resolve through the self-reference", () => {
    const require = createRequire(import.meta.url);
    expect(require.resolve("@carlonicora/nextjs-jsonapi/messages/en.json")).toMatch(/messages\/en\.json$/);
  });
});
