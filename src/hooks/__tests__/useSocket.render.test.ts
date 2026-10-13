import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({ default: vi.fn() }));

import { useSocket } from "../useSocket";

describe("useSocket render", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Under Cache Components a Math.random() during render marks the enclosing
  // boundary as dynamic, so a layout's SocketProvider would keep the whole app
  // frame out of the prerendered shell.
  it("never calls Math.random while rendering", () => {
    const random = vi.spyOn(Math, "random");
    const { rerender } = renderHook(() => useSocket({ token: "" }));
    rerender();
    expect(random).not.toHaveBeenCalled();
  });
});
