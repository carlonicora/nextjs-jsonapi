import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AbstractApiData } from "../../../../core/abstracts/AbstractApiData";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { JsonApiHydratedDataInterface } from "../../../../core/interfaces/JsonApiHydratedDataInterface";
import { resolveReferenceableModules } from "../resolveReferenceableModules";

// ---------------------------------------------------------------------------
// Test-only model WITH identifierFields (default: ["name"]) — should be included
// ---------------------------------------------------------------------------
class WithIdentifier extends AbstractApiData {
  static identifierFields: string[] = ["name"];

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }

  createJsonApi(_data?: any): any {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Test-only model WITHOUT identifierFields (forced to []) — should be excluded
// ---------------------------------------------------------------------------
class WithoutIdentifier extends AbstractApiData {
  static identifierFields: string[] = [];

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }

  createJsonApi(_data?: any): any {
    return {};
  }
}

const withIdentifierModule: ApiRequestDataTypeInterface = {
  name: "test-with-identifier",
  model: WithIdentifier,
} as any;

const withoutIdentifierModule: ApiRequestDataTypeInterface = {
  name: "test-without-identifier",
  model: WithoutIdentifier,
} as any;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeAll(() => {
  DataClassRegistry.clear();
  DataClassRegistry.registerObjectClass(withIdentifierModule, WithIdentifier);
  DataClassRegistry.registerObjectClass(withoutIdentifierModule, WithoutIdentifier);
  ModuleRegistry.register("TestWithIdentifier", withIdentifierModule);
  ModuleRegistry.register("TestWithoutIdentifier", withoutIdentifierModule);
});

afterAll(() => {
  DataClassRegistry.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("resolveReferenceableModules", () => {
  it("returns an array of ApiRequestDataTypeInterface-shaped entries (has .name: string)", () => {
    const result = resolveReferenceableModules();

    expect(Array.isArray(result)).toBe(true);
    for (const entry of result) {
      expect(typeof entry.name).toBe("string");
    }
  });

  it("includes modules whose model class has non-empty identifierFields", () => {
    const result = resolveReferenceableModules();

    const names = result.map((m) => m.name);
    expect(names).toContain("test-with-identifier");
  });

  it("excludes modules whose model class has empty identifierFields", () => {
    const result = resolveReferenceableModules();

    const names = result.map((m) => m.name);
    expect(names).not.toContain("test-without-identifier");
  });
});
