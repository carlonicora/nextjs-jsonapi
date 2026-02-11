import { describe, it, expect, beforeEach, vi } from "vitest";
import { AbstractApiData } from "../AbstractApiData";
import { DataClassRegistry } from "../../registry/DataClassRegistry";
import { ApiDataInterface } from "../../interfaces/ApiDataInterface";
import { JsonApiHydratedDataInterface } from "../../interfaces/JsonApiHydratedDataInterface";
import { ApiRequestDataTypeInterface } from "../../interfaces/ApiRequestDataTypeInterface";

// Concrete test class to access protected method
class TestModel extends AbstractApiData {
  public testReadIncludedPolymorphic<T extends ApiDataInterface>(
    data: JsonApiHydratedDataInterface,
    relationshipKey: string,
    candidateModules: ApiRequestDataTypeInterface[],
  ): T | T[] | undefined {
    return this._readIncludedPolymorphic<T>(data, relationshipKey, candidateModules);
  }
}

class MockTaxonomy extends AbstractApiData {
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }
}

class MockLeafTaxonomy extends AbstractApiData {
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }
}

const taxonomyModule: ApiRequestDataTypeInterface = {
  name: "taxonomies",
  model: MockTaxonomy,
} as any;

const leafTaxonomyModule: ApiRequestDataTypeInterface = {
  name: "leaf-taxonomies",
  model: MockLeafTaxonomy,
} as any;

describe("_readIncludedPolymorphic", () => {
  beforeEach(() => {
    DataClassRegistry.clear();
    DataClassRegistry.registerObjectClass(taxonomyModule, MockTaxonomy);
    DataClassRegistry.registerObjectClass(leafTaxonomyModule, MockLeafTaxonomy);
  });

  describe("Scenario: Mixed-type array relationship", () => {
    it("should rehydrate items with correct model based on JSON:API type", () => {
      // GIVEN: JSON:API data with mixed taxonomy types in relationship
      const data: JsonApiHydratedDataInterface = {
        jsonApi: {
          id: "skill-1",
          type: "skills",
          attributes: { name: "React Development" },
          relationships: {
            taxonomies: {
              data: [
                { id: "tax-1", type: "taxonomies" },
                { id: "leaf-1", type: "leaf-taxonomies" },
                { id: "tax-2", type: "taxonomies" },
              ],
            },
          },
        },
        included: [
          { id: "tax-1", type: "taxonomies", attributes: { name: "Engineering" } },
          { id: "leaf-1", type: "leaf-taxonomies", attributes: { name: "React" } },
          { id: "tax-2", type: "taxonomies", attributes: { name: "Design" } },
        ],
      };

      // WHEN: _readIncludedPolymorphic is called with both candidate modules
      const model = new TestModel();
      const result = model.testReadIncludedPolymorphic(data, "taxonomies", [taxonomyModule, leafTaxonomyModule]);

      // THEN: Returns array with correct model instances
      expect(Array.isArray(result)).toBe(true);
      const items = result as ApiDataInterface[];
      expect(items).toHaveLength(3);
      expect(items[0]).toBeInstanceOf(MockTaxonomy);
      expect(items[1]).toBeInstanceOf(MockLeafTaxonomy);
      expect(items[2]).toBeInstanceOf(MockTaxonomy);
    });
  });

  describe("Scenario: Missing included data returns undefined", () => {
    it("should return undefined when included array is empty", () => {
      // GIVEN: JSON:API data with no included items
      const data: JsonApiHydratedDataInterface = {
        jsonApi: {
          id: "skill-1",
          type: "skills",
          attributes: {},
          relationships: {
            taxonomies: {
              data: [{ id: "tax-1", type: "taxonomies" }],
            },
          },
        },
        included: [],
      };

      // WHEN: _readIncludedPolymorphic is called
      const model = new TestModel();
      const result = model.testReadIncludedPolymorphic(data, "taxonomies", [taxonomyModule, leafTaxonomyModule]);

      // THEN: Returns undefined
      expect(result).toBeUndefined();
    });

    it("should return undefined when relationship data is missing", () => {
      // GIVEN: JSON:API data without the relationship key
      const data: JsonApiHydratedDataInterface = {
        jsonApi: {
          id: "skill-1",
          type: "skills",
          attributes: {},
          relationships: {},
        },
        included: [{ id: "tax-1", type: "taxonomies", attributes: { name: "Engineering" } }],
      };

      // WHEN: _readIncludedPolymorphic is called
      const model = new TestModel();
      const result = model.testReadIncludedPolymorphic(data, "taxonomies", [taxonomyModule, leafTaxonomyModule]);

      // THEN: Returns undefined
      expect(result).toBeUndefined();
    });
  });

  describe("Scenario: Unknown type in relationship is skipped", () => {
    it("should skip items with types not in candidate modules", () => {
      // GIVEN: JSON:API data with an unknown type in the relationship
      const data: JsonApiHydratedDataInterface = {
        jsonApi: {
          id: "skill-1",
          type: "skills",
          attributes: {},
          relationships: {
            taxonomies: {
              data: [
                { id: "tax-1", type: "taxonomies" },
                { id: "unknown-1", type: "unknown-type" },
              ],
            },
          },
        },
        included: [
          { id: "tax-1", type: "taxonomies", attributes: { name: "Engineering" } },
          { id: "unknown-1", type: "unknown-type", attributes: { name: "Unknown" } },
        ],
      };

      // WHEN: _readIncludedPolymorphic is called
      const model = new TestModel();
      const result = model.testReadIncludedPolymorphic(data, "taxonomies", [taxonomyModule, leafTaxonomyModule]);

      // THEN: Only the known type is returned
      expect(Array.isArray(result)).toBe(true);
      const items = result as ApiDataInterface[];
      expect(items).toHaveLength(1);
      expect(items[0]).toBeInstanceOf(MockTaxonomy);
    });
  });

  describe("Scenario: Single polymorphic relationship", () => {
    it("should rehydrate single relationship with correct type", () => {
      // GIVEN: JSON:API data with a single (non-array) polymorphic relationship
      const data: JsonApiHydratedDataInterface = {
        jsonApi: {
          id: "skill-1",
          type: "skills",
          attributes: {},
          relationships: {
            primaryTaxonomy: {
              data: { id: "leaf-1", type: "leaf-taxonomies" },
            },
          },
        },
        included: [{ id: "leaf-1", type: "leaf-taxonomies", attributes: { name: "React" } }],
      };

      // WHEN: _readIncludedPolymorphic is called for single relationship
      const model = new TestModel();
      const result = model.testReadIncludedPolymorphic(data, "primaryTaxonomy", [taxonomyModule, leafTaxonomyModule]);

      // THEN: Returns a single LeafTaxonomy instance
      expect(result).toBeInstanceOf(MockLeafTaxonomy);
    });
  });
});
