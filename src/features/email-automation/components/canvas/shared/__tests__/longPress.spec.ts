import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLongPressTracker } from "../longPress";

describe("createLongPressTracker", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires after the hold delay with the press point", () => {
    const onLongPress = vi.fn();
    const tracker = createLongPressTracker({ onLongPress });
    tracker.down("scene:1", 40, 50);
    vi.advanceTimersByTime(499);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onLongPress).toHaveBeenCalledWith({ target: "scene:1", clientX: 40, clientY: 50 });
  });

  it("does not fire when the finger lifts early", () => {
    const onLongPress = vi.fn();
    const tracker = createLongPressTracker({ onLongPress });
    tracker.down("scene:1", 0, 0);
    vi.advanceTimersByTime(300);
    tracker.up();
    vi.advanceTimersByTime(500);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(tracker.consumeClick()).toBe(false);
  });

  it("tolerates jitter but cancels on a real move (pan or drag)", () => {
    const onLongPress = vi.fn();
    const tracker = createLongPressTracker({ onLongPress });
    tracker.down("scene:1", 0, 0);
    tracker.move(5, 5);
    vi.advanceTimersByTime(500);
    expect(onLongPress).toHaveBeenCalledTimes(1);

    tracker.down("scene:1", 0, 0);
    tracker.move(20, 0);
    vi.advanceTimersByTime(500);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("swallows exactly one click after a fired press", () => {
    const tracker = createLongPressTracker({ onLongPress: () => {} });
    tracker.down("scene:1", 0, 0);
    vi.advanceTimersByTime(500);
    tracker.up();
    expect(tracker.consumeClick()).toBe(true);
    expect(tracker.consumeClick()).toBe(false);
  });
});
