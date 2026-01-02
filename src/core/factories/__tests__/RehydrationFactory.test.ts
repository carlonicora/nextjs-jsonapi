import { describe, it, expect, beforeEach, vi } from "vitest";
import { RehydrationFactory } from "../RehydrationFactory";
import { DataClassRegistry } from "../../registry/DataClassRegistry";
import { ApiDataInterface } from "../../interfaces/ApiDataInterface";
import { JsonApiHydratedDataInterface } from "../../interfaces/JsonApiHydratedDataInterface";

// Mock class that tracks rehydrate calls
class MockDataClass implements Partial<ApiDataInterface> {
  type = "articles";
  id = "1";
  rehydratedData: JsonApiHydratedDataInterface | null = null;

  rehydrate(data: JsonApiHydratedDataInterface) {
    this.rehydratedData = data;
    return this;
  }

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
  createJsonApi(data: any) {
    return { type: this.type, attributes: data };
  }
}

describe("RehydrationFactory", () => {
  const mockModule = { name: "articles", model: MockDataClass };

  beforeEach(() => {
    DataClassRegistry.clear();
  });

  describe("rehydrate", () => {
    it("should rehydrate a single data object", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const hydratedData: JsonApiHydratedDataInterface = {
        jsonApi: { type: "articles", id: "1", attributes: { title: "Test" } },
        included: [],
        allData: [],
      };

      const result = RehydrationFactory.rehydrate(mockModule as any, hydratedData);

      expect(result).toBeInstanceOf(MockDataClass);
      expect((result as MockDataClass).rehydratedData).toBe(hydratedData);
    });

    it("should throw for unregistered module", () => {
      const unregisteredModule = { name: "unknown", model: MockDataClass };

      const hydratedData: JsonApiHydratedDataInterface = {
        jsonApi: {},
        included: [],
      };

      expect(() =>
        RehydrationFactory.rehydrate(unregisteredModule as any, hydratedData)
      ).toThrow("Class not registered for key: unknown");
    });

    it("should create a new instance for rehydration", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const hydratedData1: JsonApiHydratedDataInterface = {
        jsonApi: { type: "articles", id: "1" },
        included: [],
      };
      const hydratedData2: JsonApiHydratedDataInterface = {
        jsonApi: { type: "articles", id: "2" },
        included: [],
      };

      const result1 = RehydrationFactory.rehydrate(mockModule as any, hydratedData1);
      const result2 = RehydrationFactory.rehydrate(mockModule as any, hydratedData2);

      // Each rehydration should create a new instance
      expect(result1).not.toBe(result2);
    });
  });

  describe("rehydrateList", () => {
    it("should rehydrate an array of data objects", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const hydratedDataList: JsonApiHydratedDataInterface[] = [
        { jsonApi: { type: "articles", id: "1" }, included: [] },
        { jsonApi: { type: "articles", id: "2" }, included: [] },
        { jsonApi: { type: "articles", id: "3" }, included: [] },
      ];

      const results = RehydrationFactory.rehydrateList(mockModule as any, hydratedDataList);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toBeInstanceOf(MockDataClass);
        expect((result as MockDataClass).rehydratedData).toBe(hydratedDataList[index]);
      });
    });

    it("should return empty array for empty input", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const results = RehydrationFactory.rehydrateList(mockModule as any, []);

      expect(results).toEqual([]);
    });

    it("should throw for unregistered module", () => {
      const unregisteredModule = { name: "unknown", model: MockDataClass };

      expect(() =>
        RehydrationFactory.rehydrateList(unregisteredModule as any, [
          { jsonApi: {}, included: [] },
        ])
      ).toThrow("Class not registered for key: unknown");
    });

    it("should create unique instances for each item", () => {
      DataClassRegistry.registerObjectClass(mockModule as any, MockDataClass as any);

      const hydratedDataList: JsonApiHydratedDataInterface[] = [
        { jsonApi: { type: "articles", id: "1" }, included: [] },
        { jsonApi: { type: "articles", id: "2" }, included: [] },
      ];

      const results = RehydrationFactory.rehydrateList(mockModule as any, hydratedDataList);

      // Each item should be a unique instance
      expect(results[0]).not.toBe(results[1]);
    });
  });
});
