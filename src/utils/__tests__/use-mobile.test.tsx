import { render, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile, VIEWPORT_COOKIE_NAME } from "../use-mobile";
// The provider lives in `contexts/` (not `utils/`) because the server layouts
// render it directly and only `dist/contexts/*` gets tsup's "use client" banner.
import { ViewportProvider } from "../../contexts/ViewportContext";

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
