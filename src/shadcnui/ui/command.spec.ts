import { defaultFilter } from "cmdk";
import { describe, expect, it } from "vitest";

import { commandFilterByKeywords } from "./command";

describe("commandFilterByKeywords", () => {
  it("scores the keywords exactly as cmdk scores the same text used as a value", () => {
    expect(commandFilterByKeywords("u1", "mar", ["Mario Rossi"])).toBe(defaultFilter("Mario Rossi", "mar"));
    expect(commandFilterByKeywords("u1", "mar", ["Mario Rossi"])).toBeGreaterThan(0);
  });

  it("does not match an id-like value when the keywords do not match", () => {
    expect(commandFilterByKeywords("9f3c-uuid-1234", "1234", ["Mario Rossi"])).toBe(0);
    expect(commandFilterByKeywords("u3", "u3", ["Anna Bianchi"])).toBe(0);
  });

  it("joins several keywords into one searchable text", () => {
    expect(commandFilterByKeywords("u1", "rossi", ["Mario", "Rossi"])).toBeGreaterThan(0);
  });

  it("falls back to the value when there are no keywords", () => {
    expect(commandFilterByKeywords("Mario Rossi", "mar")).toBe(defaultFilter("Mario Rossi", "mar"));
    expect(commandFilterByKeywords("Mario Rossi", "mar", [])).toBeGreaterThan(0);
    expect(commandFilterByKeywords("Mario Rossi", "zzz", [])).toBe(0);
  });
});
