import { describe, it, expect } from "vitest";
import { detectExtendsContent } from "../transformers/parent-detector";
import { JsonFieldDefinition } from "../types/json-schema.interface";

const fields = (names: string[]): JsonFieldDefinition[] =>
  names.map((name) => ({ name, type: "string", nullable: true }));

describe("detectExtendsContent", () => {
  it("is opt-in: false when extendsContent is not set, even with a name field", () => {
    expect(detectExtendsContent(fields(["name", "tldr", "abstract"]))).toBe(false);
  });

  it("is true only when explicitly enabled", () => {
    expect(detectExtendsContent(fields(["name"]), true)).toBe(true);
  });

  it("respects an explicit false", () => {
    expect(detectExtendsContent(fields(["name", "abstract"]), false)).toBe(false);
  });
});
