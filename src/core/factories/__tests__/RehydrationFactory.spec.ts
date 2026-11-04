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
  get identifier() {
    return "MockDataClass";
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

      expect(() => RehydrationFactory.rehydrate(unregisteredModule as any, hydratedData)).toThrow(
        "Class not registered for key: unknown",
      );
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
        RehydrationFactory.rehydrateList(unregisteredModule as any, [{ jsonApi: {}, included: [] }]),
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

  describe("circular included data", () => {
    // A model that reads its "other" relationship from included, as AbstractApiData models do.
    class Linked implements Partial<ApiDataInterface> {
      id = "";
      other?: Linked;
      rehydrate(data: JsonApiHydratedDataInterface) {
        this.id = data.jsonApi.id;
        const ref = data.jsonApi.relationships?.other?.data;
        const target = ref && data.included.find((item: any) => item.type === ref.type && item.id === ref.id);
        if (target)
          this.other = RehydrationFactory.rehydrate(linkedModule as any, { jsonApi: target, included: data.included });
        return this;
      }
    }
    const linkedModule = { name: "linked", model: Linked };

    it("a relationship that leads back to a resource already being rehydrated is skipped, not followed forever", () => {
      DataClassRegistry.registerObjectClass(linkedModule as any, Linked as any);
      const a = { type: "linked", id: "a", relationships: { other: { data: { type: "linked", id: "b" } } } };
      const b = { type: "linked", id: "b", relationships: { other: { data: { type: "linked", id: "a" } } } };

      const result = RehydrationFactory.rehydrate<any>(linkedModule as any, { jsonApi: a, included: [a, b] });

      expect(result.id).toBe("a");
      expect(result.other.id).toBe("b");
      expect(result.other.other).toBeUndefined();
      // The guard is per chain: the same resource rehydrates again in a new call.
      expect(RehydrationFactory.rehydrate<any>(linkedModule as any, { jsonApi: b, included: [a, b] }).other.id).toBe(
        "a",
      );
    });
  });

  describe("a resource reached through several relationships", () => {
    // A model that reads every resource its "links" relationship points to from included.
    let calls = 0;
    class Node implements Partial<ApiDataInterface> {
      id = "";
      links: Node[] = [];
      rehydrate(data: JsonApiHydratedDataInterface) {
        calls++;
        this.id = data.jsonApi.id;
        for (const ref of data.jsonApi.relationships?.links?.data ?? []) {
          const target = data.included.find((item: any) => item.type === ref.type && item.id === ref.id);
          if (!target) continue;
          const node = RehydrationFactory.rehydrate<any>(nodeModule as any, { jsonApi: target, included: data.included });
          if (node) this.links.push(node);
        }
        return this;
      }
    }
    const nodeModule = { name: "nodes", model: Node };
    const node = (id: string, links: string[]) => ({
      type: "nodes",
      id,
      relationships: { links: { data: links.map((link) => ({ type: "nodes", id: link })) } },
    });

    beforeEach(() => {
      calls = 0;
      DataClassRegistry.registerObjectClass(nodeModule as any, Node as any);
    });

    it("is rehydrated once and the same model is reused", () => {
      // root -> left, right; left -> shared; right -> shared
      const included = [node("left", ["shared"]), node("right", ["shared"]), node("shared", [])];
      const result = RehydrationFactory.rehydrate<any>(nodeModule as any, {
        jsonApi: node("root", ["left", "right"]),
        included,
      });

      expect(result.links[0].links[0].id).toBe("shared");
      expect(result.links[0].links[0]).toBe(result.links[1].links[0]);
      expect(calls).toBe(4);
    });

    it("densely linked included data is rehydrated in linear, not exponential, work", () => {
      // Twelve resources, each linked to every other one: every path through them would be 11! chains.
      const ids = Array.from({ length: 12 }, (_, index) => `n${index}`);
      const included = ids.map((id) => node(id, ids.filter((other) => other !== id)));

      const result = RehydrationFactory.rehydrate<any>(nodeModule as any, { jsonApi: included[0], included });

      expect(result.links).toHaveLength(11);
      expect(calls).toBe(12);
    });

    it("every top-level resource of a list is rehydrated whole, even one already reached as a relationship", () => {
      // a -> b, b -> a: inside a, b's link back to a is skipped; b as its own list entry has it.
      const a = node("a", ["b"]);
      const b = node("b", ["a"]);
      const [first, second] = RehydrationFactory.rehydrateList<any>(nodeModule as any, [
        { jsonApi: a, included: [a, b] },
        { jsonApi: b, included: [a, b] },
      ]);

      expect(first.links[0].id).toBe("b");
      expect(first.links[0].links).toHaveLength(0);
      expect(second.links[0].id).toBe("a");
      expect(second).not.toBe(first.links[0]);
    });

    it("nothing is reused across separate calls", () => {
      const included = [node("shared", [])];
      const one = RehydrationFactory.rehydrate<any>(nodeModule as any, { jsonApi: node("x", ["shared"]), included });
      const two = RehydrationFactory.rehydrate<any>(nodeModule as any, { jsonApi: node("y", ["shared"]), included });

      expect(one.links[0]).not.toBe(two.links[0]);
    });
  });
});
