import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserInterface } from "../../features/user/data";
import usePushNotifications from "../usePushNotifications";

// Hoisted so the vi.mock factories below can read it (Vitest hoists factories
// above module-scope consts).
const mocks = vi.hoisted(() => ({ register: vi.fn() }));

vi.mock("../../core/env", () => ({
  ENV: {
    VAPID_PUBLIC_KEY: "",
  },
}));

vi.mock("../../features/push/data/push.service", () => ({
  PushService: { register: mocks.register },
}));

// The hook reads only `id` from the user; the fixture is typed as the real
// input so a signature change fails here first.
const user = { id: "user-1" } as UserInterface;

function Probe(props: Parameters<typeof usePushNotifications>[0]) {
  usePushNotifications(props);
  return null;
}

const subscription = { endpoint: "e1", keys: { p256dh: "a", auth: "b" } };

describe("usePushNotifications", () => {
  const register = vi.fn().mockResolvedValue({ pushManager: { getSubscription: vi.fn() } });
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  function messageListener(): (event: MessageEvent) => void {
    const call = addEventListener.mock.calls.find(([type]) => type === "message");
    if (!call) throw new Error("no message listener registered");
    return call[1];
  }

  beforeEach(() => {
    register.mockClear();
    addEventListener.mockClear();
    removeEventListener.mockClear();
    mocks.register.mockReset();
    mocks.register.mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      serviceWorker: { register, ready: Promise.resolve(), addEventListener, removeEventListener },
    });
    vi.stubGlobal("PushManager", function PushManager() {});
    // "denied" makes the registration effect return right after registering, so
    // these specs prove the URL choice and the rotation flow, not subscription handling.
    vi.stubGlobal("Notification", { permission: "denied", requestPermission: vi.fn() });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers /sw.js with updateViaCache none for a user who can subscribe", async () => {
    render(<Probe currentUser={user} canSubscribe={true} />);
    await waitFor(() => expect(register).toHaveBeenCalledWith("/sw.js", { updateViaCache: "none" }));
  });

  it("does not register without a user", async () => {
    render(<Probe canSubscribe={true} />);
    await act(async () => {});
    expect(register).not.toHaveBeenCalled();
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it("does not register when the user cannot subscribe", async () => {
    render(<Probe currentUser={user} canSubscribe={false} />);
    await act(async () => {});
    expect(register).not.toHaveBeenCalled();
  });

  it("re-registers a rotated subscription once per tab", async () => {
    render(<Probe currentUser={user} canSubscribe={true} />);
    const onMessage = messageListener();
    const event = { data: { type: "PUSH_RESUBSCRIBED", subscription } } as MessageEvent;

    act(() => onMessage(event));
    await waitFor(() =>
      expect(sessionStorage.getItem("push_registered_user-1")).toBe(btoa(JSON.stringify(subscription))),
    );

    act(() => onMessage(event));
    await act(async () => {});

    expect(mocks.register).toHaveBeenCalledTimes(1);
    expect(mocks.register).toHaveBeenCalledWith({ data: subscription });
  });

  it("ignores other message types and a PUSH_RESUBSCRIBED without a subscription", async () => {
    render(<Probe currentUser={user} canSubscribe={true} />);
    const onMessage = messageListener();

    act(() => onMessage({ data: { type: "SOMETHING_ELSE", subscription } } as MessageEvent));
    act(() => onMessage({ data: { type: "PUSH_RESUBSCRIBED" } } as MessageEvent));
    act(() => onMessage({ data: undefined } as MessageEvent));
    await act(async () => {});

    expect(mocks.register).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("push_registered_user-1")).toBeNull();
  });

  it("does not re-register a rotation when the user cannot subscribe", async () => {
    render(<Probe currentUser={user} canSubscribe={false} />);
    await act(async () => {});
    expect(addEventListener).not.toHaveBeenCalledWith("message", expect.any(Function));
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("removes the message listener on unmount", () => {
    const { unmount } = render(<Probe currentUser={user} canSubscribe={true} />);
    const onMessage = messageListener();
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("message", onMessage);
  });
});
