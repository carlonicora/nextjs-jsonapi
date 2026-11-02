import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { io, fakeSocket } = vi.hoisted(() => {
  const fakeSocket = {
    id: undefined,
    connected: true,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  return { fakeSocket, io: vi.fn(() => fakeSocket) };
});
vi.mock("socket.io-client", () => ({ default: io }));

import { useSocket } from "../useSocket";

describe("useSocket pause (offline mode)", () => {
  it("disconnects while paused and connects the same socket again when resumed", () => {
    const { rerender } = renderHook(({ paused }) => useSocket({ token: "t1", paused }), {
      initialProps: { paused: false },
    });
    expect(io).toHaveBeenCalledTimes(1);
    expect(fakeSocket.disconnect).not.toHaveBeenCalled();

    rerender({ paused: true });
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
    rerender({ paused: true });
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(fakeSocket.connect).not.toHaveBeenCalled();

    rerender({ paused: false });
    expect(fakeSocket.connect).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledTimes(1);
  });
});
