import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { clearClientStorage } from "../clearClientStorage";

describe("clearClientStorage", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(global, "window", {
      value: { localStorage: localStorageMock },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "window", {
      value: originalWindow,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  describe("Scenario: Clears specified storage keys", () => {
    it("should remove each specified key from localStorage", () => {
      const keys = ["user", "person", "recentPages"];

      clearClientStorage(keys);

      expect(window.localStorage.removeItem).toHaveBeenCalledTimes(3);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("user");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("person");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("recentPages");
    });
  });

  describe("Scenario: Handles empty key array gracefully", () => {
    it("should not call removeItem when given empty array", () => {
      clearClientStorage([]);

      expect(window.localStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: SSR-safe execution", () => {
    it("should return early without error when window is undefined", () => {
      Object.defineProperty(global, "window", {
        value: undefined,
        writable: true,
      });

      expect(() => clearClientStorage(["user", "person"])).not.toThrow();
    });
  });

  describe("Scenario: Handles keys with special characters", () => {
    it("should properly remove keys containing colons", () => {
      const keys = [
        "react-resizable-panels:page-content-container-desktop:left-panel:right-panel",
        "react-resizable-panels:page-content-container-mobile:left-panel:right-panel",
      ];

      clearClientStorage(keys);

      expect(window.localStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        "react-resizable-panels:page-content-container-desktop:left-panel:right-panel",
      );
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        "react-resizable-panels:page-content-container-mobile:left-panel:right-panel",
      );
    });
  });
});
