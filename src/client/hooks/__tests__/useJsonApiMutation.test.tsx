import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { useJsonApiMutation } from "../useJsonApiMutation";
import { MockJsonApiProvider } from "../../../testing/providers/MockJsonApiProvider";
import { createMockModule, createMockResponse, createMockApiData } from "../../../testing";

// Mock the JsonApiRequest module
vi.mock("../../../unified/JsonApiRequest", () => ({
  JsonApiPost: vi.fn(),
  JsonApiPut: vi.fn(),
  JsonApiPatch: vi.fn(),
  JsonApiDelete: vi.fn(),
}));

describe("useJsonApiMutation", () => {
  const mockModule = createMockModule({ name: "articles" });
  const mockData = createMockApiData({
    type: "articles",
    id: "1",
    attributes: { title: "Created Article" },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockJsonApiProvider>{children}</MockJsonApiProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("POST mutations", () => {
    it("should initialize with idle state", () => {
      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "POST",
            classKey: mockModule,
          }),
        { wrapper }
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.response).toBeNull();
    });

    it("should execute POST mutation", async () => {
      const { JsonApiPost } = await import("../../../unified/JsonApiRequest");
      const mockResponse = createMockResponse({ data: mockData, ok: true });
      (JsonApiPost as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "POST",
            classKey: mockModule,
          }),
        { wrapper }
      );

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutate({
          endpoint: "/articles",
          body: { title: "New Article" },
        });
      });

      expect(result.current.data).toBe(mockData);
      expect(result.current.error).toBeNull();
      expect(mutationResult).toBe(mockData);
      expect(JsonApiPost).toHaveBeenCalled();
    });

    it("should handle POST errors", async () => {
      const { JsonApiPost } = await import("../../../unified/JsonApiRequest");
      const errorResponse = createMockResponse({
        ok: false,
        response: 400,
        error: "Validation failed",
      });
      (JsonApiPost as any).mockResolvedValue(errorResponse);

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "POST",
            classKey: mockModule,
          }),
        { wrapper }
      );

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutate({
          endpoint: "/articles",
          body: {},
        });
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe("Validation failed");
      expect(mutationResult).toBeNull();
    });

    it("should call onSuccess callback", async () => {
      const { JsonApiPost } = await import("../../../unified/JsonApiRequest");
      const mockResponse = createMockResponse({ data: mockData, ok: true });
      (JsonApiPost as any).mockResolvedValue(mockResponse);
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "POST",
            classKey: mockModule,
            onSuccess,
          }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutate({
          endpoint: "/articles",
          body: { title: "New" },
        });
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });

    it("should call onError callback", async () => {
      const { JsonApiPost } = await import("../../../unified/JsonApiRequest");
      const errorResponse = createMockResponse({
        ok: false,
        error: "Failed",
      });
      (JsonApiPost as any).mockResolvedValue(errorResponse);
      const onError = vi.fn();

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "POST",
            classKey: mockModule,
            onError,
          }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutate({
          endpoint: "/articles",
          body: {},
        });
      });

      expect(onError).toHaveBeenCalledWith("Failed");
    });
  });

  describe("PUT mutations", () => {
    it("should execute PUT mutation", async () => {
      const { JsonApiPut } = await import("../../../unified/JsonApiRequest");
      const mockResponse = createMockResponse({ data: mockData, ok: true });
      (JsonApiPut as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "PUT",
            classKey: mockModule,
          }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutate({
          endpoint: "/articles/1",
          body: { title: "Updated" },
        });
      });

      expect(JsonApiPut).toHaveBeenCalled();
      expect(result.current.data).toBe(mockData);
    });
  });

  describe("PATCH mutations", () => {
    it("should execute PATCH mutation", async () => {
      const { JsonApiPatch } = await import("../../../unified/JsonApiRequest");
      const mockResponse = createMockResponse({ data: mockData, ok: true });
      (JsonApiPatch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "PATCH",
            classKey: mockModule,
          }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutate({
          endpoint: "/articles/1",
          body: { title: "Patched" },
        });
      });

      expect(JsonApiPatch).toHaveBeenCalled();
      expect(result.current.data).toBe(mockData);
    });
  });

  describe("DELETE mutations", () => {
    it("should execute DELETE mutation", async () => {
      const { JsonApiDelete } = await import("../../../unified/JsonApiRequest");
      const mockResponse = createMockResponse({ data: mockData, ok: true });
      (JsonApiDelete as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "DELETE",
            classKey: mockModule,
          }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutate({
          endpoint: "/articles/1",
        });
      });

      expect(JsonApiDelete).toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("should reset state", async () => {
      const { JsonApiPost } = await import("../../../unified/JsonApiRequest");
      const mockResponse = createMockResponse({ data: mockData, ok: true });
      (JsonApiPost as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "POST",
            classKey: mockModule,
          }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutate({
          endpoint: "/articles",
          body: {},
        });
      });

      expect(result.current.data).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.response).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe("loading state", () => {
    it("should set loading during mutation", async () => {
      const { JsonApiPost } = await import("../../../unified/JsonApiRequest");
      let resolvePromise: any;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (JsonApiPost as any).mockReturnValue(pendingPromise);

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "POST",
            classKey: mockModule,
          }),
        { wrapper }
      );

      // Start mutation without awaiting
      act(() => {
        result.current.mutate({
          endpoint: "/articles",
          body: {},
        });
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise(createMockResponse({ data: mockData, ok: true }));
      });

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("error handling", () => {
    it("should handle thrown exceptions", async () => {
      const { JsonApiPost } = await import("../../../unified/JsonApiRequest");
      (JsonApiPost as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(
        () =>
          useJsonApiMutation({
            method: "POST",
            classKey: mockModule,
          }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutate({
          endpoint: "/articles",
          body: {},
        });
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.data).toBeNull();
    });
  });
});
