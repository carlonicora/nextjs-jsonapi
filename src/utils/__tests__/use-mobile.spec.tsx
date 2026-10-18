import * as React from "react";
import { Suspense } from "react";
import { render, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getViewportContext, useIsMobile, VIEWPORT_COOKIE_NAME } from "../use-mobile";
// The provider lives in `contexts/` (not `utils/`) because the server layouts
// render it directly and only `dist/contexts/*` gets tsup's "use client" banner.
import { ViewportProvider } from "../../contexts/ViewportContext";
import type { SessionSnapshot } from "../../server/ServerSession";

function Probe() {
  const isMobile = useIsMobile();
  return <span data-testid="probe">{isMobile ? "mobile" : "desktop"}</span>;
}

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
}

beforeEach(() => {
  setWidth(1280);
  document.cookie = `${VIEWPORT_COOKIE_NAME}=; path=/; max-age=0`;
  vi.mocked(window.matchMedia).mockClear();
});

describe("server-graph safety", () => {
  /**
   * Regression guard. This module is reachable from the RSC/Node graph:
   * apps/web instrumentation.ts -> jsonapi.config -> Bootstrapper ->
   * @carlonicora/nextjs-jsonapi/core -> utils barrel -> use-mobile.
   * Creating the context at module scope crashed the dev server on boot
   * ("createContext is not a function"), because React resolves to the
   * vendored RSC build there. Importing must stay side-effect free.
   */
  it("does not create the context merely by being imported", async () => {
    const key = Symbol.for("nextjs-jsonapi:viewportContext");
    const store = globalThis as unknown as Record<symbol, unknown>;
    const previous = store[key];
    delete store[key];

    try {
      vi.resetModules();
      await import("../use-mobile");
      expect(store[key]).toBeUndefined();
    } finally {
      store[key] = previous;
      vi.resetModules();
    }
  });

  it("creates the context on first call and returns a stable identity after", async () => {
    const key = Symbol.for("nextjs-jsonapi:viewportContext");
    const store = globalThis as unknown as Record<symbol, unknown>;
    const previous = store[key];
    delete store[key];

    try {
      vi.resetModules();
      const { getViewportContext } = await import("../use-mobile");
      const first = getViewportContext();
      expect(first).toBeDefined();
      expect(getViewportContext()).toBe(first);
    } finally {
      store[key] = previous;
      vi.resetModules();
    }
  });
});

describe("useIsMobile with a ViewportProvider", () => {
  it("returns the server seed on the first render, before any measurement", () => {
    setWidth(1280);
    const seen: string[] = [];
    function Recorder() {
      const isMobile = useIsMobile();
      seen.push(isMobile ? "mobile" : "desktop");
      return null;
    }
    render(
      <ViewportProvider initialIsMobile={true}>
        <Recorder />
      </ViewportProvider>,
    );
    expect(seen[0]).toBe("mobile");
  });

  it("corrects a wrong seed after mounting and persists the measurement", () => {
    setWidth(1280);
    render(
      <ViewportProvider initialIsMobile={true}>
        <Probe />
      </ViewportProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("desktop");
    expect(document.cookie).toContain(`${VIEWPORT_COOKIE_NAME}=0`);
  });

  it("keeps a correct seed and persists it", () => {
    setWidth(500);
    render(
      <ViewportProvider initialIsMobile={true}>
        <Probe />
      </ViewportProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("mobile");
    expect(document.cookie).toContain(`${VIEWPORT_COOKIE_NAME}=1`);
  });

  it("follows a viewport change through the matchMedia listener", () => {
    setWidth(1280);
    render(
      <ViewportProvider initialIsMobile={false}>
        <Probe />
      </ViewportProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("desktop");

    const mql = vi.mocked(window.matchMedia).mock.results[0].value;
    const handler = mql.addEventListener.mock.calls[0][1] as () => void;
    setWidth(500);
    act(() => handler());

    expect(screen.getByTestId("probe").textContent).toBe("mobile");
  });
});

describe("useIsMobile without a provider (legacy fallback)", () => {
  it("measures the viewport itself and does not write a cookie", () => {
    setWidth(500);
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("mobile");
    expect(document.cookie).not.toContain(`${VIEWPORT_COOKIE_NAME}=`);
  });

  it("reports desktop for a wide viewport", () => {
    setWidth(1280);
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("desktop");
  });
});

describe("ViewportProvider with a session promise", () => {
  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  const snapshot = (isMobile: boolean): SessionSnapshot => ({
    isLogged: true,
    isAdministrator: false,
    token: "t",
    sidebarOpen: true,
    isMobile,
  });

  it("ViewportProvider with a session renders children before the promise resolves", () => {
    const pending = deferred<SessionSnapshot>();
    render(
      <ViewportProvider session={pending.promise}>
        <span>child</span>
      </ViewportProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("useIsMobile suspends on a promise-based provider and then returns the seeded value", async () => {
    // In jsdom the provider's mount-time measurement replaces the promise with a
    // boolean straight after the first commit, so the fallback is recorded rather
    // than asserted in the final DOM. The width agrees with the seed.
    setWidth(500);
    const fallbacks: string[] = [];
    function Waiting() {
      fallbacks.push("waiting");
      return <span>waiting</span>;
    }
    const pending = deferred<SessionSnapshot>();
    await act(async () => {
      render(
        <ViewportProvider session={pending.promise}>
          <Suspense fallback={<Waiting />}>
            <Probe />
          </Suspense>
        </ViewportProvider>,
      );
    });
    expect(fallbacks[0]).toBe("waiting");

    await act(async () => {
      pending.resolve(snapshot(true));
      await pending.promise;
    });

    expect(screen.getByTestId("probe").textContent).toBe("mobile");
  });

  it("useIsMobile reads the resolved value of a promise in the context, not a measurement", async () => {
    // No ViewportProvider, so nothing measures: what the reader shows is the seed.
    setWidth(1280);
    const ViewportContext = getViewportContext();
    const pending = deferred<boolean>();
    await act(async () => {
      render(
        <ViewportContext.Provider value={pending.promise}>
          <Suspense fallback="waiting">
            <Probe />
          </Suspense>
        </ViewportContext.Provider>,
      );
    });
    expect(screen.getByText("waiting")).toBeInTheDocument();

    await act(async () => {
      pending.resolve(true);
      await pending.promise;
    });

    expect(screen.getByTestId("probe").textContent).toBe("mobile");
  });

  it("calls use() on every render when a pending seed is replaced by a boolean while the reader is suspended", async () => {
    // The sequence behind the "conditional-use-of-use" console error seen on
    // /deliveries/<id> and on (admin) not-found pages:
    // 1. a reader mounts while ViewportProvider's value is still the session
    //    promise, so useIsMobile() calls use() and suspends;
    // 2. the provider's mount-time measurement replaces the promise with a
    //    boolean (setIsMobile) before the session settles;
    // 3. the reader retries with a plain boolean. Skipping use() on that render
    //    makes React log "This library called use() to suspend in a previous
    //    render but did not call use() when it finished".
    // The provider's state swap is driven by hand here so that step 2 lands
    // after the suspended mount, as it does when hydration wins the race.
    const ViewportContext = getViewportContext();
    let swap!: (value: boolean | Promise<boolean>) => void;
    function SwappingProvider({ children }: { children: React.ReactNode }) {
      const [value, setValue] = React.useState<boolean | Promise<boolean>>(() => deferred<boolean>().promise);
      swap = setValue;
      return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>;
    }

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () => {
        render(
          <SwappingProvider>
            <Suspense fallback="waiting">
              <Probe />
            </Suspense>
          </SwappingProvider>,
        );
      });
      expect(screen.queryByText("waiting")).not.toBeNull();

      await act(async () => {
        swap(true);
      });

      expect(screen.getByTestId("probe").textContent).toBe("mobile");
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("lets the provider's measurement win over a session seed that settles later, without console errors", async () => {
    setWidth(500);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const pending = deferred<SessionSnapshot>();
      await act(async () => {
        render(
          <ViewportProvider session={pending.promise}>
            <Suspense fallback="waiting">
              <Probe />
            </Suspense>
          </ViewportProvider>,
        );
      });
      expect(screen.getByTestId("probe").textContent).toBe("mobile");

      await act(async () => {
        pending.resolve(snapshot(false));
        await pending.promise;
      });

      expect(screen.getByTestId("probe").textContent).toBe("mobile");
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("keeps calling use() when the context value goes from a boolean to a promise", async () => {
    // The reverse switch: a reader mounted on a boolean still suspends on, and
    // then reads, a promise that replaces it.
    setWidth(1280);
    const ViewportContext = getViewportContext();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const pending = deferred<boolean>();
      const { rerender } = render(
        <ViewportContext.Provider value={false}>
          <Suspense fallback="waiting">
            <Probe />
          </Suspense>
        </ViewportContext.Provider>,
      );
      expect(screen.getByTestId("probe").textContent).toBe("desktop");

      await act(async () => {
        rerender(
          <ViewportContext.Provider value={pending.promise}>
            <Suspense fallback="waiting">
              <Probe />
            </Suspense>
          </ViewportContext.Provider>,
        );
      });
      await act(async () => {
        pending.resolve(true);
        await pending.promise;
      });

      expect(screen.getByTestId("probe").textContent).toBe("mobile");
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("ViewportProvider with initialIsMobile is unchanged", () => {
    setWidth(1280);
    const seen: string[] = [];
    function Recorder() {
      const isMobile = useIsMobile();
      seen.push(isMobile ? "mobile" : "desktop");
      return <span data-testid="probe">{isMobile ? "mobile" : "desktop"}</span>;
    }
    render(
      <ViewportProvider initialIsMobile={false}>
        <Recorder />
      </ViewportProvider>,
    );
    expect(seen[0]).toBe("desktop");
    expect(screen.getByTestId("probe").textContent).toBe("desktop");
  });
});
