import { describe, it, expect, beforeEach } from "vitest";
import { DataClassRegistry } from "../DataClassRegistry";
import { ApiDataInterface } from "../../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../../interfaces/ApiRequestDataTypeInterface";

class MockTaxonomy implements ApiDataInterface {
  _id?: string;
  _type?: string;
  get id(): string {
    return this._id ?? "";
  }
  get type(): string {
    return this._type ?? "";
  }
  get self(): string | undefined {
    return undefined;
  }
  get createdAt(): Date {
    return new Date();
  }
  get updatedAt(): Date {
    return new Date();
  }
  get included(): any[] {
    return [];
  }
  get jsonApi(): any {
    return undefined;
  }
  ingestJsonApi(): void {}
  generateApiUrl(): string {
    return "";
  }
  createJsonApi(): any {
    return {};
  }
  rehydrate(data: any): this {
    return this;
  }
  dehydrate(): any {
    return {};
  }
}

class MockLeafTaxonomy implements ApiDataInterface {
  _id?: string;
  _type?: string;
  get id(): string {
    return this._id ?? "";
  }
  get type(): string {
    return this._type ?? "";
  }
  get self(): string | undefined {
    return undefined;
  }
  get createdAt(): Date {
    return new Date();
  }
  get updatedAt(): Date {
    return new Date();
  }
  get included(): any[] {
    return [];
  }
  get jsonApi(): any {
    return undefined;
  }
  ingestJsonApi(): void {}
  generateApiUrl(): string {
    return "";
  }
  createJsonApi(): any {
    return {};
  }
  rehydrate(data: any): this {
    return this;
  }
  dehydrate(): any {
    return {};
  }
}

describe("DataClassRegistry.getByJsonApiType", () => {
  beforeEach(() => {
    DataClassRegistry.clear();
  });

  describe("Scenario: Lookup returns registered class for known type", () => {
    it("should return the class constructor for a registered type name", () => {
      // GIVEN: Two modules registered with different type names
      const taxonomyModule: ApiRequestDataTypeInterface = {
        name: "taxonomies",
        model: MockTaxonomy,
      } as any;
      const leafTaxonomyModule: ApiRequestDataTypeInterface = {
        name: "leaf-taxonomies",
        model: MockLeafTaxonomy,
      } as any;

      DataClassRegistry.registerObjectClass(taxonomyModule, MockTaxonomy);
      DataClassRegistry.registerObjectClass(leafTaxonomyModule, MockLeafTaxonomy);

      // WHEN: getByJsonApiType is called with a registered type name
      const result = DataClassRegistry.getByJsonApiType("taxonomies");

      // THEN: It returns the correct class constructor
      expect(result).toBe(MockTaxonomy);
    });

    it("should return leaf taxonomy class for leaf-taxonomies type", () => {
      // GIVEN: LeafTaxonomy module registered
      const leafTaxonomyModule: ApiRequestDataTypeInterface = {
        name: "leaf-taxonomies",
        model: MockLeafTaxonomy,
      } as any;
      DataClassRegistry.registerObjectClass(leafTaxonomyModule, MockLeafTaxonomy);

      // WHEN: getByJsonApiType is called with "leaf-taxonomies"
      const result = DataClassRegistry.getByJsonApiType("leaf-taxonomies");

      // THEN: It returns MockLeafTaxonomy
      expect(result).toBe(MockLeafTaxonomy);
    });
  });

  describe("Scenario: Lookup returns undefined for unknown type", () => {
    it("should return undefined for an unregistered type name", () => {
      // GIVEN: No modules registered (registry cleared)

      // WHEN: getByJsonApiType is called with an unknown type
      const result = DataClassRegistry.getByJsonApiType("unknown-type");

      // THEN: It returns undefined
      expect(result).toBeUndefined();
    });
  });
});
