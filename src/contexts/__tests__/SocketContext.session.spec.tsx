import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionSnapshot } from "../../server/ServerSession";

const { useSocketMock } = vi.hoisted(() => ({
  useSocketMock: vi.fn((_options: { token?: string }) => ({
    socket: null,
    isConnected: false,
    messages: [],
    socketNotifications: [],
    sendMessage: () => {},
    removeMessage: () => {},
    removeSocketNotification: () => {},
    clearMessages: () => {},
    clearSocketNotifications: () => {},
  })),
}));

vi.mock("../../hooks/useSocket", () => ({ useSocket: useSocketMock }));

import { SocketProvider } from "../SocketContext";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const snapshot = (token: string): SessionSnapshot => ({
  isLogged: true,
  isAdministrator: false,
  token,
  sidebarOpen: true,
  isMobile: false,
});

beforeEach(() => {
  useSocketMock.mockClear();
});

describe("SocketProvider with a session", () => {
  it("renders children before the session resolves", () => {
    const pending = deferred<SessionSnapshot>();
    render(
      <SocketProvider session={pending.promise}>
        <span>child</span>
      </SocketProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(useSocketMock).toHaveBeenLastCalledWith({ token: undefined });
  });

  it("connects with the token once the session resolves", async () => {
    const pending = deferred<SessionSnapshot>();
    render(
      <SocketProvider session={pending.promise}>
        <span>child</span>
      </SocketProvider>,
    );
    await act(async () => {
      pending.resolve(snapshot("t1"));
      await pending.promise;
    });
    expect(useSocketMock).toHaveBeenLastCalledWith({ token: "t1" });
  });

  it("still accepts a plain token", () => {
    render(
      <SocketProvider token="t2">
        <span>child</span>
      </SocketProvider>,
    );
    expect(useSocketMock.mock.calls[0][0]).toEqual({ token: "t2" });
  });
});
