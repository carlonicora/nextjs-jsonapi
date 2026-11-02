import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionSnapshot } from "../../server/ServerSession";

const { useSocketMock } = vi.hoisted(() => ({
  useSocketMock: vi.fn((_options: { token?: string; paused?: boolean }) => ({
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

import { configureOffline, resetOfflineConfig } from "../../offline/config";
import { resetOfflineState, setOfflineState } from "../../offline/state";
import type { OfflineConfig } from "../../offline/types";
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
    expect(useSocketMock).toHaveBeenLastCalledWith({ token: undefined, paused: false });
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
    expect(useSocketMock).toHaveBeenLastCalledWith({ token: "t1", paused: false });
  });

  it("still accepts a plain token", () => {
    render(
      <SocketProvider token="t2">
        <span>child</span>
      </SocketProvider>,
    );
    expect(useSocketMock.mock.calls[0][0]).toEqual({ token: "t2", paused: false });
  });
});

describe("SocketProvider and offline mode", () => {
  const offlineConfig = {
    getUserId: () => "u1",
    rootModule: { name: "roots" },
    types: [],
    routes: [],
    listSyncRoots: async () => [],
    shellPath: () => "/offline-shell",
    syncIntervalMs: 300000,
  } as unknown as OfflineConfig;

  afterEach(() => {
    resetOfflineConfig();
    resetOfflineState();
  });

  it("with offline mode configured, pauses the socket while the session is offline and resumes it when back online", () => {
    configureOffline(offlineConfig);
    setOfflineState({ online: true });
    render(
      <SocketProvider token="t3">
        <span>child</span>
      </SocketProvider>,
    );
    expect(useSocketMock).toHaveBeenLastCalledWith({ token: "t3", paused: false });

    act(() => setOfflineState({ online: false }));
    expect(useSocketMock).toHaveBeenLastCalledWith({ token: "t3", paused: true });

    act(() => setOfflineState({ online: true }));
    expect(useSocketMock).toHaveBeenLastCalledWith({ token: "t3", paused: false });
  });

  it("without offline mode configured, never pauses the socket", () => {
    setOfflineState({ online: false });
    render(
      <SocketProvider token="t4">
        <span>child</span>
      </SocketProvider>,
    );
    expect(useSocketMock).toHaveBeenLastCalledWith({ token: "t4", paused: false });
  });
});
