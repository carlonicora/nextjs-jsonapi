import { describe, it, expect } from "vitest";
import { exists } from "../exists";

describe("exists", () => {
  describe("with null and undefined", () => {
    it("should return false for null", () => {
      expect(exists(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(exists(undefined)).toBe(false);
    });
  });

  describe("with arrays", () => {
    it("should return true for non-empty array", () => {
      expect(exists([1, 2, 3])).toBe(true);
    });

    it("should return false for empty array", () => {
      expect(exists([])).toBe(false);
    });

    it("should return true for array with one element", () => {
      expect(exists([1])).toBe(true);
    });

    it("should return true for array of objects", () => {
      expect(exists([{ id: 1 }, { id: 2 }])).toBe(true);
    });

    it("should return true for array with null elements", () => {
      // Array exists even if it contains null values
      expect(exists([null, null])).toBe(true);
    });

    it("should return true for array with undefined elements", () => {
      // Array exists even if it contains undefined values
      expect(exists([undefined, undefined])).toBe(true);
    });
  });

  describe("with single values", () => {
    it("should return true for non-zero number", () => {
      expect(exists(42)).toBe(true);
    });

    it("should return false for zero", () => {
      // Note: 0 is falsy so exists returns false
      expect(exists(0)).toBe(false);
    });

    it("should return true for non-empty string", () => {
      expect(exists("hello")).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(exists("")).toBe(false);
    });

    it("should return true for object", () => {
      expect(exists({ id: 1 })).toBe(true);
    });

    it("should return true for empty object", () => {
      expect(exists({})).toBe(true);
    });

    it("should return true for true boolean", () => {
      expect(exists(true)).toBe(true);
    });

    it("should return false for false boolean", () => {
      expect(exists(false)).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should work with string type", () => {
      const value: string | null = "test";
      expect(exists(value)).toBe(true);
    });

    it("should work with number type", () => {
      const value: number | undefined = 10;
      expect(exists(value)).toBe(true);
    });

    it("should work with object type", () => {
      type User = { name: string };
      const value: User | null = { name: "John" };
      expect(exists(value)).toBe(true);
    });

    it("should work with array type", () => {
      const value: string[] | null = ["a", "b"];
      expect(exists(value)).toBe(true);
    });
  });
});
