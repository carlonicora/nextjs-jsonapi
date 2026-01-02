import { describe, it, expect, beforeEach } from "vitest";
import { DataClassRegistry, DataClass } from "../DataClassRegistry";
import { createMockModule } from "../../../testing";
import { ApiDataInterface } from "../../interfaces/ApiDataInterface";

// Mock class for testing
class MockArticle implements Partial<ApiDataInterface> {
  type = "articles";
  id = "1";
  get included() {
    return [];
  }
  get createdAt() {
    return new Date();
  }
  get updatedAt() {
    return new Date();
  }
  get self() {
    return "/articles/1";
  }
  get jsonApi() {
    return { type: this.type, id: this.id };
  }
  generateApiUrl() {
    return `/articles/${this.id}`;
  }
  dehydrate() {
    return { jsonApi: this.jsonApi, included: [], allData: [] };
  }
  rehydrate(data: any) {
    return this;
  }
  createJsonApi(data: any) {
    return { type: this.type, attributes: data };
  }
}

describe("DataClassRegistry", () => {
  beforeEach(() => {
    DataClassRegistry.clear();
  });

  describe("registerObjectClass", () => {
    it("should register a class", () => {
      const module = createMockModule({ name: "articles" });
      DataClassRegistry.registerObjectClass(module, MockArticle as any);
      expect(() => DataClassRegistry.get(module)).not.toThrow();
    });

    it("should not register duplicate classes", () => {
      const module = createMockModule({ name: "articles" });
      DataClassRegistry.registerObjectClass(module, MockArticle as any);
      DataClassRegistry.registerObjectClass(module, MockArticle as any);
      // Should not throw, just ignore duplicate
      expect(() => DataClassRegistry.get(module)).not.toThrow();
    });
  });

  describe("get", () => {
    it("should retrieve registered class", () => {
      const module = createMockModule({ name: "articles" });
      DataClassRegistry.registerObjectClass(module, MockArticle as any);
      const retrieved = DataClassRegistry.get(module);
      expect(retrieved).toBe(MockArticle);
    });

    it("should throw for unregistered class", () => {
      const module = createMockModule({ name: "unknown" });
      expect(() => DataClassRegistry.get(module)).toThrow(
        "Class not registered for key: unknown"
      );
    });
  });

  describe("bootstrap", () => {
    it("should register all modules from object", () => {
      const modules = {
        Article: {
          name: "articles",
          model: MockArticle,
        },
        User: {
          name: "users",
          model: MockArticle,
        },
      };

      DataClassRegistry.bootstrap(modules as any);

      expect(() =>
        DataClassRegistry.get({ name: "articles", model: MockArticle } as any)
      ).not.toThrow();
      expect(() =>
        DataClassRegistry.get({ name: "users", model: MockArticle } as any)
      ).not.toThrow();
    });

    it("should skip modules without model", () => {
      const modules = {
        Article: {
          name: "articles",
          model: MockArticle,
        },
        Invalid: {
          name: "invalid",
          // no model
        },
      };

      DataClassRegistry.bootstrap(modules as any);

      expect(() =>
        DataClassRegistry.get({ name: "articles", model: MockArticle } as any)
      ).not.toThrow();
      expect(() =>
        DataClassRegistry.get({ name: "invalid", model: null } as any)
      ).toThrow();
    });
  });

  describe("clear", () => {
    it("should clear all registered classes", () => {
      const module = createMockModule({ name: "articles" });
      DataClassRegistry.registerObjectClass(module, MockArticle as any);
      DataClassRegistry.clear();
      expect(() => DataClassRegistry.get(module)).toThrow();
    });
  });

  describe("DataClass alias", () => {
    it("should be an alias for DataClassRegistry", () => {
      expect(DataClass).toBe(DataClassRegistry);
    });
  });
});
