import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay callback execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current("test");
    });

    // Callback should not be called immediately
    expect(callback).not.toHaveBeenCalled();

    // Advance timers by 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now callback should be called
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("test");
  });

  it("should reset timer on subsequent calls", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current("first");
    });

    // Advance 300ms (less than delay)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Call again - should reset timer
    act(() => {
      result.current("second");
    });

    // Advance another 300ms (total 600ms from first call, but only 300ms from second)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Still not called
    expect(callback).not.toHaveBeenCalled();

    // Advance remaining 200ms
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now should be called with the second argument
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("second");
  });

  it("should cancel pending call", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current("test");
    });

    // Cancel before timer fires
    act(() => {
      result.current.cancel();
    });

    // Advance past delay
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Callback should not be called
    expect(callback).not.toHaveBeenCalled();
  });

  it("should pass multiple arguments to callback", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebounce((a: string, b: number, c: boolean) => callback(a, b, c), 500)
    );

    act(() => {
      result.current("hello", 42, true);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith("hello", 42, true);
  });

  it("should update callback reference when callback changes", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useDebounce(cb, 500),
      { initialProps: { cb: callback1 } }
    );

    act(() => {
      result.current("test");
    });

    // Change callback before timer fires
    rerender({ cb: callback2 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should call the new callback
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith("test");
  });

  it("should handle different delay values", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 1000));

    act(() => {
      result.current("test");
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle zero delay", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 0));

    act(() => {
      result.current("test");
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(callback).toHaveBeenCalledWith("test");
  });
});
