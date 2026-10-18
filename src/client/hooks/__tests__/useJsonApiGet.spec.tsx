import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { useJsonApiGet } from "../useJsonApiGet";
import { MockJsonApiProvider } from "../../../testing/providers/MockJsonApiProvider";
import { createMockModule, createMockResponse, createMockApiData } from "../../../testing";

// Mock the JsonApiRequest module
vi.mock("../../../unified/JsonApiRequest", () => ({
  JsonApiGet: vi.fn(),
}));

describe("useJsonApiGet", () => {
  const mockModule = createMockModule({ name: "articles" });
  const mockData = createMockApiData({ type: "articles", id: "1", attributes: { title: "Test Article" } });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockJsonApiProvider>{children}</MockJsonApiProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should initialize with loading state", async () => {
    const { JsonApiGet } = await import("../../../unified/JsonApiRequest");
    (JsonApiGet as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(
      () =>
        useJsonApiGet({
          classKey: mockModule,
          endpoint: "/articles/1",
        }),
      { wrapper },
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should fetch data on mount", async () => {
    const { JsonApiGet } = await import("../../../unified/JsonApiRequest");
    const mockResponse = createMockResponse({ data: mockData, ok: true });
    (JsonApiGet as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useJsonApiGet({
          classKey: mockModule,
          endpoint: "/articles/1",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.response).toBe(mockResponse);
  });

  it("should not fetch when enabled is false", async () => {
    const { JsonApiGet } = await import("../../../unified/JsonApiRequest");
    (JsonApiGet as any).mockResolvedValue(createMockResponse({ data: mockData, ok: true }));

    const { result } = renderHook(
      () =>
        useJsonApiGet({
          classKey: mockModule,
          endpoint: "/articles/1",
          options: { enabled: false },
        }),
      { wrapper },
    );

    // Wait a bit to ensure no fetch happens
    await new Promise((r) => setTimeout(r, 100));

    expect(JsonApiGet).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("should handle errors", async () => {
    const { JsonApiGet } = await import("../../../unified/JsonApiRequest");
    const errorResponse = createMockResponse({
      ok: false,
      response: 404,
      error: "Not Found",
    });
    (JsonApiGet as any).mockResolvedValue(errorResponse);

    const { result } = renderHook(
      () =>
        useJsonApiGet({
          classKey: mockModule,
          endpoint: "/articles/999",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Not Found");
  });

  it("should handle thrown errors", async () => {
    const { JsonApiGet } = await import("../../../unified/JsonApiRequest");
    (JsonApiGet as any).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () =>
        useJsonApiGet({
          classKey: mockModule,
          endpoint: "/articles/1",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
  });

  it("should support refetch", async () => {
    const { JsonApiGet } = await import("../../../unified/JsonApiRequest");
    let callCount = 0;
    (JsonApiGet as any).mockImplementation(() => {
      callCount++;
      return Promise.resolve(
        createMockResponse({
          data: createMockApiData({
            type: "articles",
            id: "1",
            attributes: { title: `Article ${callCount}` },
          }),
          ok: true,
        }),
      );
    });

    const { result } = renderHook(
      () =>
        useJsonApiGet({
          classKey: mockModule,
          endpoint: "/articles/1",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(callCount).toBe(1);

    // Trigger refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(callCount).toBe(2);
  });

  it("should indicate pagination availability", async () => {
    const { JsonApiGet } = await import("../../../unified/JsonApiRequest");
    const mockResponse = createMockResponse({
      data: mockData,
      ok: true,
      next: "/articles?page=2",
      prev: "/articles?page=0",
    });
    (JsonApiGet as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useJsonApiGet({
          classKey: mockModule,
          endpoint: "/articles",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(true);
  });

  it("should handle no pagination", async () => {
    const { JsonApiGet } = await import("../../../unified/JsonApiRequest");
    const mockResponse = createMockResponse({
      data: mockData,
      ok: true,
    });
    (JsonApiGet as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useJsonApiGet({
          classKey: mockModule,
          endpoint: "/articles/1",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPreviousPage).toBe(false);
  });
});
