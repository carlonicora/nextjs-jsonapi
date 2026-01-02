import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRehydration, useRehydrationList } from "../useRehydration";
import { DataClassRegistry } from "../../../core/registry/DataClassRegistry";
import { ApiDataInterface } from "../../../core/interfaces/ApiDataInterface";
import { JsonApiHydratedDataInterface } from "../../../core/interfaces/JsonApiHydratedDataInterface";

// Mock data class for testing
class MockArticle implements Partial<ApiDataInterface> {
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

const mockModule = { name: "articles", model: MockArticle };

describe("useRehydration", () => {
  beforeEach(() => {
    DataClassRegistry.clear();
    DataClassRegistry.registerObjectClass(mockModule as any, MockArticle as any);
  });

  it("should rehydrate data", () => {
    const hydratedData: JsonApiHydratedDataInterface = {
      jsonApi: { type: "articles", id: "1", attributes: { title: "Test" } },
      included: [],
    };

    const { result } = renderHook(() =>
      useRehydration<MockArticle>(mockModule as any, hydratedData)
    );

    expect(result.current).toBeInstanceOf(MockArticle);
    expect(result.current?.rehydratedData).toBe(hydratedData);
  });

  it("should return null for null data", () => {
    const { result } = renderHook(() =>
      useRehydration<MockArticle>(mockModule as any, null)
    );

    expect(result.current).toBeNull();
  });

  it("should return null for undefined data", () => {
    const { result } = renderHook(() =>
      useRehydration<MockArticle>(mockModule as any, undefined)
    );

    expect(result.current).toBeNull();
  });

  it("should memoize result for same data", () => {
    const hydratedData: JsonApiHydratedDataInterface = {
      jsonApi: { type: "articles", id: "1" },
      included: [],
    };

    const { result, rerender } = renderHook(() =>
      useRehydration<MockArticle>(mockModule as any, hydratedData)
    );

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    // Should be the same reference (memoized)
    expect(firstResult).toBe(secondResult);
  });

  it("should update when data changes", () => {
    const hydratedData1: JsonApiHydratedDataInterface = {
      jsonApi: { type: "articles", id: "1" },
      included: [],
    };
    const hydratedData2: JsonApiHydratedDataInterface = {
      jsonApi: { type: "articles", id: "2" },
      included: [],
    };

    const { result, rerender } = renderHook(
      ({ data }) => useRehydration<MockArticle>(mockModule as any, data),
      { initialProps: { data: hydratedData1 } }
    );

    const firstResult = result.current;
    rerender({ data: hydratedData2 });
    const secondResult = result.current;

    // Should be different instances
    expect(firstResult).not.toBe(secondResult);
  });
});

describe("useRehydrationList", () => {
  beforeEach(() => {
    DataClassRegistry.clear();
    DataClassRegistry.registerObjectClass(mockModule as any, MockArticle as any);
  });

  it("should rehydrate a list of data", () => {
    const hydratedDataList: JsonApiHydratedDataInterface[] = [
      { jsonApi: { type: "articles", id: "1" }, included: [] },
      { jsonApi: { type: "articles", id: "2" }, included: [] },
      { jsonApi: { type: "articles", id: "3" }, included: [] },
    ];

    const { result } = renderHook(() =>
      useRehydrationList<MockArticle>(mockModule as any, hydratedDataList)
    );

    expect(result.current).toHaveLength(3);
    result.current.forEach((item, index) => {
      expect(item).toBeInstanceOf(MockArticle);
      expect(item.rehydratedData).toBe(hydratedDataList[index]);
    });
  });

  it("should return empty array for null data", () => {
    const { result } = renderHook(() =>
      useRehydrationList<MockArticle>(mockModule as any, null)
    );

    expect(result.current).toEqual([]);
  });

  it("should return empty array for undefined data", () => {
    const { result } = renderHook(() =>
      useRehydrationList<MockArticle>(mockModule as any, undefined)
    );

    expect(result.current).toEqual([]);
  });

  it("should return empty array for empty array input", () => {
    const { result } = renderHook(() =>
      useRehydrationList<MockArticle>(mockModule as any, [])
    );

    expect(result.current).toEqual([]);
  });

  it("should memoize result for same data", () => {
    const hydratedDataList: JsonApiHydratedDataInterface[] = [
      { jsonApi: { type: "articles", id: "1" }, included: [] },
    ];

    const { result, rerender } = renderHook(() =>
      useRehydrationList<MockArticle>(mockModule as any, hydratedDataList)
    );

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });
});
