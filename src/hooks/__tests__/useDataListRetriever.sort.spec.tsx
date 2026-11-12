import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockModule } from "../../testing";
import { useDataListRetriever } from "../useDataListRetriever";

describe("useDataListRetriever sort", () => {
  const mockModule = createMockModule({ name: "accounts" });

  beforeEach(() => {
    window.history.replaceState(null, "", "/accounts?sort%5Baccounts%5D=-name");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
  });

  it("reads the sort from the address and fetches once with it", async () => {
    const retriever = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useDataListRetriever({ retriever, module: mockModule }));

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(retriever).toHaveBeenCalledTimes(1);
    expect(retriever.mock.calls[0][0].sort).toBe("-name");
    expect(result.current.sort).toBe("-name");
  });

  it("refetches once with the new sort and the current search term", async () => {
    const retriever = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useDataListRetriever({ retriever, module: mockModule }));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.search("rossi");
    });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    retriever.mockClear();

    await act(async () => {
      result.current.setSort("name");
    });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(retriever).toHaveBeenCalledTimes(1);
    expect(retriever.mock.calls[0][0].sort).toBe("name");
    expect(retriever.mock.calls[0][0].search).toBe("rossi");
    expect(result.current.sort).toBe("name");
    expect(new URLSearchParams(window.location.search).get("sort[accounts]")).toBe("name");
  });

  it("returns to page 1 when the sort changes", async () => {
    const retriever = vi.fn().mockImplementation(async (params: { next?: { next?: string } }) => {
      if (params.next) params.next.next = "accounts?page[offset]=25";
      return [];
    });
    const { result } = renderHook(() => useDataListRetriever({ retriever, module: mockModule }));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    await waitFor(() => expect(result.current.next).toBeDefined());

    retriever.mockClear();
    retriever.mockResolvedValue([]);
    await act(async () => {
      result.current.setSort("name");
    });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    // The refetch goes through the list's own retriever (page 1), never the stored next-page link.
    expect(retriever).toHaveBeenCalledTimes(1);
    expect(retriever.mock.calls[0][0].sort).toBe("name");
    expect(result.current.next).toBeUndefined();
    expect(result.current.previous).toBeUndefined();
  });

  it("sends no sort after it is cleared", async () => {
    const retriever = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useDataListRetriever({ retriever, module: mockModule }));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    retriever.mockClear();

    await act(async () => {
      result.current.setSort(null);
    });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(retriever).toHaveBeenCalledTimes(1);
    expect(retriever.mock.calls[0][0].sort).toBeUndefined();
    expect(result.current.sort).toBeUndefined();
  });

  it("uses sortKey over the module name", async () => {
    window.history.replaceState(null, "", "/accounts?sort%5Bclients%5D=name&sort%5Baccounts%5D=-name");
    const retriever = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useDataListRetriever({ retriever, module: mockModule, sortKey: "clients" }));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(retriever).toHaveBeenCalledTimes(1);
    expect(retriever.mock.calls[0][0].sort).toBe("name");
  });

  it("exposes defaultSort and never sends it", async () => {
    window.history.replaceState(null, "", "/accounts");
    const retriever = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() =>
      useDataListRetriever({ retriever, module: mockModule, defaultSort: "-updatedAt" }),
    );
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.defaultSort).toBe("-updatedAt");
    expect(result.current.sort).toBeUndefined();
    expect(retriever).toHaveBeenCalledTimes(1);
    expect(retriever.mock.calls[0][0].sort).toBeUndefined();
  });
});
