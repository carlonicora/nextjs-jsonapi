import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDataListRetriever } from "../useDataListRetriever";
import { createMockModule, createMockApiData } from "../../testing";

describe("useDataListRetriever", () => {
  const mockModule = createMockModule({ name: "articles" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with default state", async () => {
      const retriever = vi.fn().mockResolvedValue([]);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      // Wait for async operations to settle
      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.ready).toBe(true);
      expect(result.current.isSearch).toBe(false);
    });

    it("should respect ready=false", async () => {
      const retriever = vi.fn().mockResolvedValue([]);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
          ready: false,
        })
      );

      expect(result.current.ready).toBe(false);
      // Retriever should not be called when not ready
      expect(retriever).not.toHaveBeenCalled();
    });
  });

  describe("data fetching", () => {
    it("should fetch data when ready", async () => {
      const mockData = [
        createMockApiData({ type: "articles", id: "1", attributes: { title: "Article 1" } }),
        createMockApiData({ type: "articles", id: "2", attributes: { title: "Article 2" } }),
      ];
      const retriever = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(retriever).toHaveBeenCalled();
    });

    it("should handle fetch errors gracefully", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const retriever = vi.fn().mockRejectedValue(new Error("Fetch failed"));

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe("search", () => {
    it("should search and call retriever with search term", async () => {
      const mockData = [
        createMockApiData({ type: "articles", id: "1", attributes: { title: "Search Result" } }),
      ];
      const retriever = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const callCountBefore = retriever.mock.calls.length;

      await act(async () => {
        await result.current.search("test query");
      });

      await waitFor(() => {
        // Verify retriever was called again with the search term
        expect(retriever.mock.calls.length).toBeGreaterThan(callCountBefore);
        const lastCall = retriever.mock.calls[retriever.mock.calls.length - 1][0];
        expect(lastCall.search).toBe("test query");
      });
    });

    it("should not search if query is unchanged", async () => {
      const retriever = vi.fn().mockResolvedValue([]);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const callCountBefore = retriever.mock.calls.length;

      // Search with same empty query
      await act(async () => {
        await result.current.search("");
      });

      // Should not trigger additional fetch
      expect(retriever.mock.calls.length).toBe(callCountBefore);
    });
  });

  describe("refresh", () => {
    it("should refresh data", async () => {
      const mockData = [createMockApiData({ type: "articles", id: "1" })];
      const retriever = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const callCountBefore = retriever.mock.calls.length;

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(retriever.mock.calls.length).toBeGreaterThan(callCountBefore);
      });
    });
  });

  describe("setReady", () => {
    it("should allow setting ready state", async () => {
      const retriever = vi.fn().mockResolvedValue([]);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
          ready: false,
        })
      );

      expect(result.current.ready).toBe(false);

      act(() => {
        result.current.setReady(true);
      });

      // Wait for async operations triggered by setReady(true) to settle
      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.ready).toBe(true);
    });
  });

  describe("element management", () => {
    it("should update element with setRefreshedElement", async () => {
      const mockData = [
        createMockApiData({ type: "articles", id: "1", attributes: { title: "Original" } }),
      ];
      const retriever = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const updatedElement = createMockApiData({
        type: "articles",
        id: "1",
        attributes: { title: "Updated" },
      });

      act(() => {
        result.current.setRefreshedElement(updatedElement as any);
      });

      // Element should be updated in place
      expect(result.current.data?.[0]).toBe(updatedElement);
    });

    it("should remove element with removeElement", async () => {
      const mockData = [
        createMockApiData({ type: "articles", id: "1" }),
        createMockApiData({ type: "articles", id: "2" }),
      ];
      const retriever = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);

      act(() => {
        result.current.removeElement(mockData[0] as any);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].id).toBe("2");
    });
  });

  describe("additional parameters", () => {
    it("should add additional parameter", async () => {
      const retriever = vi.fn().mockResolvedValue([]);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addAdditionalParameter("filter", "active");
      });

      await waitFor(() => {
        expect(retriever).toHaveBeenCalledWith(
          expect.objectContaining({ filter: "active" })
        );
      });
    });

    it("should remove additional parameter", async () => {
      const retriever = vi.fn().mockResolvedValue([]);

      const { result } = renderHook(() =>
        useDataListRetriever({
          retriever,
          module: mockModule,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addAdditionalParameter("filter", "active");
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.removeAdditionalParameter("filter");
      });

      // Should refetch without the parameter
      await waitFor(() => {
        const lastCall = retriever.mock.calls[retriever.mock.calls.length - 1][0];
        expect(lastCall.filter).toBeUndefined();
      });
    });
  });
});
