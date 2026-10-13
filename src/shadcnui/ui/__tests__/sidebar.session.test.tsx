import { act, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionSnapshot } from "../../../server/ServerSession";
import { SidebarProvider, useSidebar, useSidebarControls } from "../sidebar";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function snapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return { isLogged: true, isAdministrator: false, sidebarOpen: true, isMobile: false, ...overrides };
}

function MobileReader() {
  const { isMobile } = useSidebar();
  return <p>{isMobile ? "mobile" : "desktop"}</p>;
}

let setOpenRef: ((open: boolean) => void) | undefined;
function StateReader() {
  const { state, setOpen } = useSidebar();
  setOpenRef = setOpen;
  return <p data-testid="state">{state}</p>;
}

describe("SidebarProvider with a session", () => {
  beforeEach(() => {
    setOpenRef = undefined;
    // The legacy useIsMobile path measures the viewport; jsdom has no matchMedia.
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders children before the session resolves", () => {
    const pending = new Promise<SessionSnapshot>(() => {});
    render(
      <SidebarProvider session={pending}>
        <p>child</p>
      </SidebarProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("useSidebarControls never suspends while the session is pending", () => {
    const pending = new Promise<SessionSnapshot>(() => {});
    function ControlsReader() {
      const { state, toggleSidebar } = useSidebarControls();
      return <p>{typeof toggleSidebar === "function" ? state : "missing"}</p>;
    }
    // No Suspense boundary: a suspension here would throw out of render.
    render(
      <SidebarProvider session={pending}>
        <ControlsReader />
      </SidebarProvider>,
    );
    expect(screen.getByText("expanded")).toBeInTheDocument();
  });

  it("useSidebar().isMobile suspends in the consumer and resolves", async () => {
    const session = deferred<SessionSnapshot>();
    // An async act around the suspending render lets React schedule the retry
    // when the promise resolves; a plain render() never re-renders the reader.
    await act(async () => {
      render(
        <SidebarProvider session={session.promise}>
          <React.Suspense fallback="waiting">
            <MobileReader />
          </React.Suspense>
        </SidebarProvider>,
      );
    });
    expect(screen.getByText("waiting")).toBeInTheDocument();

    await act(async () => {
      session.resolve(snapshot({ isMobile: true, sidebarOpen: true }));
    });

    expect(screen.getByText("mobile")).toBeInTheDocument();
  });

  it("applies sidebarOpen from the session once", async () => {
    const session = deferred<SessionSnapshot>();
    // useSidebar() unwraps isMobile, so every consumer sits behind a boundary.
    const ui = (
      <SidebarProvider session={session.promise}>
        <React.Suspense fallback="waiting">
          <StateReader />
        </React.Suspense>
      </SidebarProvider>
    );
    let rerender!: ReturnType<typeof render>["rerender"];
    await act(async () => {
      ({ rerender } = render(ui));
    });
    expect(screen.getByText("waiting")).toBeInTheDocument();

    await act(async () => {
      session.resolve(snapshot({ sidebarOpen: false }));
    });
    expect(screen.getByTestId("state").textContent).toBe("collapsed");

    act(() => {
      setOpenRef!(true);
    });
    expect(screen.getByTestId("state").textContent).toBe("expanded");

    rerender(ui);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("state").textContent).toBe("expanded");
  });

  it("defaultOpen still works without a session", () => {
    render(
      <SidebarProvider defaultOpen={false}>
        <StateReader />
      </SidebarProvider>,
    );
    expect(screen.getByTestId("state").textContent).toBe("collapsed");
  });
});
