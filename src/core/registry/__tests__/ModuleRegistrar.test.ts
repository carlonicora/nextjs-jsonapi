import { describe, it, expect, beforeEach } from "vitest";
import { ModuleRegistrar } from "../ModuleRegistrar";
import { DataClassRegistry } from "../DataClassRegistry";
import { ApiDataInterface } from "../../interfaces/ApiDataInterface";

// Mock class for testing
class MockUser implements Partial<ApiDataInterface> {
  type = "users";
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
    return "/users/1";
  }
  get jsonApi() {
    return { type: this.type, id: this.id };
  }
  generateApiUrl() {
    return `/users/${this.id}`;
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

// Mock Modules class with static getters
class MockModules {
  static get User() {
    return {
      name: "users",
      model: MockUser,
    };
  }

  static get Article() {
    return {
      name: "articles",
      model: MockArticle,
    };
  }

  // Regular static property (not a getter) should be ignored
  static regularProperty = "not a getter";
}

describe("ModuleRegistrar", () => {
  beforeEach(() => {
    ModuleRegistrar.reset();
  });

  describe("bootstrap", () => {
    it("should register modules from static getters", () => {
      ModuleRegistrar.bootstrap(MockModules);

      // Should be able to get registered classes
      expect(() =>
        DataClassRegistry.get({ name: "users", model: MockUser } as any)
      ).not.toThrow();
      expect(() =>
        DataClassRegistry.get({ name: "articles", model: MockArticle } as any)
      ).not.toThrow();
    });

    it("should only bootstrap once", () => {
      ModuleRegistrar.bootstrap(MockModules);
      // Clear registry manually
      DataClassRegistry.clear();
      // Bootstrap again - should not re-register because _isBootstrapped is true
      ModuleRegistrar.bootstrap(MockModules);

      // Registry should still be empty because second bootstrap was skipped
      expect(() =>
        DataClassRegistry.get({ name: "users", model: MockUser } as any)
      ).toThrow();
    });

    it("should handle class without model property", () => {
      class ModulesWithInvalid {
        static get Valid() {
          return { name: "valid", model: MockUser };
        }
        static get Invalid() {
          return { name: "invalid" }; // no model
        }
      }

      // Should not throw
      expect(() => ModuleRegistrar.bootstrap(ModulesWithInvalid)).not.toThrow();
    });
  });

  describe("reset", () => {
    it("should reset bootstrapped state", () => {
      ModuleRegistrar.bootstrap(MockModules);
      ModuleRegistrar.reset();
      // Can bootstrap again after reset
      ModuleRegistrar.bootstrap(MockModules);

      expect(() =>
        DataClassRegistry.get({ name: "users", model: MockUser } as any)
      ).not.toThrow();
    });

    it("should clear the registry", () => {
      ModuleRegistrar.bootstrap(MockModules);
      ModuleRegistrar.reset();

      // Registry should be cleared
      expect(() =>
        DataClassRegistry.get({ name: "users", model: MockUser } as any)
      ).toThrow();
    });
  });
});
