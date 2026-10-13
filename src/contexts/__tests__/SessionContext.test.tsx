import { act, render, renderHook, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it } from "vitest";
import type { SessionSnapshot } from "../../server/ServerSession";
import { SessionProvider, useSession } from "../SessionContext";

const snapshot: SessionSnapshot = {
  isLogged: true,
  isAdministrator: false,
  token: "t1",
  sidebarOpen: true,
  isMobile: false,
};

function Leaf() {
  return <span>{useSession().token}</span>;
}

describe("SessionContext", () => {
  it("renders children without waiting for the session", () => {
    render(
      <SessionProvider session={new Promise<SessionSnapshot>(() => {})}>
        <p>child</p>
      </SessionProvider>,
    );

    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("useSession suspends until the promise resolves and then returns it", async () => {
    let resolve!: (value: SessionSnapshot) => void;
    const session = new Promise<SessionSnapshot>((r) => {
      resolve = r;
    });

    // An async act around the suspending render lets React schedule the retry
    // when the promise resolves; a plain render() never re-renders the leaf.
    await act(async () => {
      render(
        <SessionProvider session={session}>
          <Suspense fallback="waiting">
            <Leaf />
          </Suspense>
        </SessionProvider>,
      );
    });

    expect(screen.getByText("waiting")).toBeInTheDocument();

    await act(async () => resolve(snapshot));

    expect(screen.getByText("t1")).toBeInTheDocument();
  });

  it("useSession throws outside a provider", () => {
    expect(() => renderHook(() => useSession())).toThrow(/SessionProvider/);
  });
});
