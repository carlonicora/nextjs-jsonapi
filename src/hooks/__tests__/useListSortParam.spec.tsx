import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useListSortParam } from "../useListSortParam";

describe("useListSortParam", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/accounts?search=x");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
  });

  it("is not ready on the first render and ready after mount", () => {
    const renders: boolean[] = [];
    const { result } = renderHook(() => {
      const state = useListSortParam({ sortKey: "accounts" });
      renders.push(state.ready);
      return state;
    });

    expect(renders[0]).toBe(false);
    expect(result.current.ready).toBe(true);
  });

  it("reads its key from the address", () => {
    window.history.replaceState(null, "", "/accounts?sort%5Baccounts%5D=-name");
    const { result } = renderHook(() => useListSortParam({ sortKey: "accounts" }));

    expect(result.current.sort).toBe("-name");
  });

  it("is undefined when the address has no value for its key", () => {
    const { result } = renderHook(() => useListSortParam({ sortKey: "accounts" }));

    expect(result.current.ready).toBe(true);
    expect(result.current.sort).toBeUndefined();
  });

  it("writes its key with replaceState, keeping the path and the other params", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => useListSortParam({ sortKey: "accounts" }));

    act(() => result.current.setSort("name"));

    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/accounts?search=x&sort%5Baccounts%5D=name");
    expect(result.current.sort).toBe("name");
  });

  it("keeps two keys on one address independent", () => {
    window.history.replaceState(null, "", "/accounts?sort%5Bcontacts%5D=-lastName");
    const accounts = renderHook(() => useListSortParam({ sortKey: "accounts" }));
    const contacts = renderHook(() => useListSortParam({ sortKey: "contacts" }));

    expect(accounts.result.current.sort).toBeUndefined();
    expect(contacts.result.current.sort).toBe("-lastName");

    act(() => accounts.result.current.setSort("name"));

    const params = new URLSearchParams(window.location.search);
    expect(params.get("sort[accounts]")).toBe("name");
    expect(params.get("sort[contacts]")).toBe("-lastName");
    expect(contacts.result.current.sort).toBe("-lastName");
  });

  it("removes only its own key on null", () => {
    window.history.replaceState(null, "", "/accounts?search=x&sort%5Baccounts%5D=name&sort%5Bcontacts%5D=-lastName");
    const { result } = renderHook(() => useListSortParam({ sortKey: "accounts" }));

    act(() => result.current.setSort(null));

    const params = new URLSearchParams(window.location.search);
    expect(params.has("sort[accounts]")).toBe(false);
    expect(params.get("sort[contacts]")).toBe("-lastName");
    expect(params.get("search")).toBe("x");
    expect(window.location.pathname).toBe("/accounts");
    expect(result.current.sort).toBeUndefined();
  });

  it("keeps the hash", () => {
    window.history.replaceState(null, "", "/accounts#top");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => useListSortParam({ sortKey: "accounts" }));

    act(() => result.current.setSort("-name"));

    expect(replaceState).toHaveBeenCalledWith(null, "", "/accounts?sort%5Baccounts%5D=-name#top");
  });
});
