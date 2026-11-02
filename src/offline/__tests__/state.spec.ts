import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureOffline, resetOfflineConfig } from "../config";
import { getOfflineState, resetOfflineState, setOfflineState, subscribeOfflineState } from "../state";
import type { OfflineConfig } from "../types";

const config: OfflineConfig = {
  getUserId: () => "u1",
  rootModule: { name: "roots", model: class {} },
  types: [],
  routes: [],
  listSyncRoots: async () => [],
  shellPath: () => "/offline-shell",
  syncIntervalMs: 300000,
};

describe("offline state", () => {
  beforeEach(() => {
    resetOfflineState();
    resetOfflineConfig();
  });

  afterEach(() => {
    resetOfflineState();
    resetOfflineConfig();
  });

  it("the offline event marks the session offline; the online event alone never brings it back (a probe or a sync must reach the API)", () => {
    configureOffline(config);
    expect(getOfflineState().online).toBe(true);

    window.dispatchEvent(new Event("offline"));
    expect(getOfflineState().online).toBe(false);

    window.dispatchEvent(new Event("online"));
    expect(getOfflineState().online).toBe(false);
  });

  it("does not follow browser events when offline mode is not configured", () => {
    window.dispatchEvent(new Event("offline"));
    expect(getOfflineState().online).toBe(true);
  });

  it("listeners are called once per change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeOfflineState(listener);

    setOfflineState({ pending: 2 });
    setOfflineState({ pending: 2 });
    setOfflineState({ lockedRootIds: ["C"] });
    setOfflineState({ lockedRootIds: ["C"] });
    setOfflineState({ online: false, draining: false });

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ online: false, pending: 2, lockedRootIds: ["C"] }),
    );

    unsubscribe();
    setOfflineState({ pending: 3 });
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
