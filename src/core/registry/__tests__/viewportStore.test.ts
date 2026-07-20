import { afterEach, describe, expect, it, vi } from "vitest";

const VIEWPORT_CONTEXT_KEY = Symbol.for("nextjs-jsonapi:viewportContext");

type GlobalStore = Record<symbol, unknown>;

afterEach(() => {
  vi.resetModules();
});

describe("viewportStore", () => {
  /**
   * Regression guard. `apps/web/src/instrumentation.ts` pulls this module into
   * the Node/RSC server graph at startup (jsonapi.config -> Bootstrapper ->
   * @carlonicora/nextjs-jsonapi/core -> utils barrel -> use-mobile ->
   * viewportStore). React resolves to the vendored RSC build there, which omits
   * `createContext`. A module-scope call crashed the dev server on boot with
   * "createContext is not a function". Importing must stay side-effect free.
   */
  it("does not create the context merely by being imported", async () => {
    const store = globalThis as unknown as GlobalStore;
    const previous = store[VIEWPORT_CONTEXT_KEY];
    delete store[VIEWPORT_CONTEXT_KEY];

    try {
      vi.resetModules();
      await import("../viewportStore");
      expect(store[VIEWPORT_CONTEXT_KEY]).toBeUndefined();
    } finally {
      store[VIEWPORT_CONTEXT_KEY] = previous;
    }
  });

  it("creates the context on first call and returns a stable identity after", async () => {
    const store = globalThis as unknown as GlobalStore;
    const previous = store[VIEWPORT_CONTEXT_KEY];
    delete store[VIEWPORT_CONTEXT_KEY];

    try {
      vi.resetModules();
      const { getViewportContext } = await import("../viewportStore");

      const first = getViewportContext();
      expect(first).toBeDefined();
      expect(getViewportContext()).toBe(first);
    } finally {
      store[VIEWPORT_CONTEXT_KEY] = previous;
    }
  });
});
