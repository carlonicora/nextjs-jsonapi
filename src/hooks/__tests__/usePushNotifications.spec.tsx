import { act, render, renderHook, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import usePushNotifications, {
  PUSH_REGISTERED_KEY_PREFIX,
  type PushNotificationsState,
  unsubscribeFromPush,
} from "../usePushNotifications";

// Hoisted so the vi.mock factories below can read it (Vitest hoists factories
// above module-scope consts). `env` is mutable so a test can set the VAPID key.
const mocks = vi.hoisted(() => ({ register: vi.fn(), env: { VAPID_PUBLIC_KEY: "" } }));

vi.mock("../../core/env", () => ({
  ENV: mocks.env,
}));

vi.mock("../../features/push/data/push.service", () => ({
  PushService: { register: mocks.register },
}));

// The hook reads only `id` from the user; the fixture is typed as the real
// input so a signature change fails here first.
const user: Parameters<typeof usePushNotifications>[0]["currentUser"] = { id: "user-1" };

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
    mocks.env.VAPID_PUBLIC_KEY = "";
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

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void };

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/**
 * A browser with the Push API: a worker registration whose push manager has no
 * subscription until `subscribe` creates one. Every step appends to `order`.
 */
function stubPushBrowser(options: {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  register?: () => Promise<unknown>;
  pushManager?: boolean;
}) {
  const order: string[] = [];
  const pushSubscription = {
    endpoint: "e1",
    toJSON: () => ({ keys: { p256dh: "a", auth: "b" } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
  let current: typeof pushSubscription | null = null;
  const pushManager = {
    getSubscription: vi.fn(async () => {
      order.push("getSubscription");
      return current;
    }),
    subscribe: vi.fn(async () => {
      order.push("subscribe");
      current = pushSubscription;
      return pushSubscription;
    }),
  };
  const registration = { pushManager };
  const swRegister = vi.fn(async () => {
    order.push("register");
    if (options.register) await options.register();
    return registration;
  });
  const notification = {
    permission: options.permission,
    requestPermission: vi.fn(() => {
      order.push("requestPermission");
      return options.requestPermission();
    }),
  };
  vi.stubGlobal("navigator", {
    serviceWorker: {
      register: swRegister,
      ready: Promise.resolve(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getRegistration: vi.fn(async () => registration),
    },
  });
  // jsdom has no PushManager: leaving it unstubbed is the "no Push API" browser.
  if (options.pushManager !== false) vi.stubGlobal("PushManager", function PushManager() {});
  vi.stubGlobal("Notification", notification);
  mocks.register.mockImplementation(async () => {
    order.push("api");
  });
  return { order, pushManager, pushSubscription, swRegister, notification };
}

describe("usePushNotifications state and enable", () => {
  beforeEach(() => {
    mocks.register.mockReset();
    mocks.env.VAPID_PUBLIC_KEY = "AAAA";
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("the on-load flow keeps its order", async () => {
    const { order } = stubPushBrowser({ permission: "default", requestPermission: async () => "granted" });
    render(<Probe currentUser={user} canSubscribe={true} />);
    await waitFor(() => expect(order).toContain("api"));
    expect(order).toEqual(["register", "requestPermission", "getSubscription", "subscribe", "api"]);
  });

  it("enable asks for permission before any await", async () => {
    const { notification, swRegister } = stubPushBrowser({
      permission: "default",
      requestPermission: () => new Promise<NotificationPermission>(() => {}),
      register: () => new Promise(() => {}),
    });
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: true }));
    await act(async () => {});
    expect(swRegister).toHaveBeenCalledTimes(1);
    expect(notification.requestPermission).not.toHaveBeenCalled();

    act(() => {
      void result.current.enable();
      expect(notification.requestPermission).toHaveBeenCalledTimes(1);
    });
  });

  it.each(["granted", "denied"] as const)("enable writes the answer %s into permission", async (answer) => {
    stubPushBrowser({ permission: "denied", requestPermission: async () => answer });
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: true }));
    await act(async () => {});
    expect(result.current.permission).toBe("denied");

    await act(async () => {
      await result.current.enable();
    });
    expect(result.current.permission).toBe(answer);
  });

  it("enable runs subscribe and register once the user allows", async () => {
    // Load-time permission "denied": the on-load flow never subscribes, so every call below is enable()'s own.
    const { pushManager } = stubPushBrowser({ permission: "denied", requestPermission: async () => "granted" });
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: true }));
    await act(async () => {});
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(mocks.register).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.enable();
    });
    expect(pushManager.subscribe).toHaveBeenCalledTimes(1);
    expect(mocks.register).toHaveBeenCalledTimes(1);
  });

  it("busy is true while enable runs and false after", async () => {
    const answer = deferred<NotificationPermission>();
    stubPushBrowser({ permission: "denied", requestPermission: () => answer.promise });
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: true }));
    await act(async () => {});
    expect(result.current.busy).toBe(false);

    let running!: Promise<void>;
    act(() => {
      running = result.current.enable();
    });
    expect(result.current.busy).toBe(true);

    await act(async () => {
      answer.resolve("denied");
      await running;
    });
    expect(result.current.busy).toBe(false);
  });

  it("overlapping runs register once", async () => {
    const api = deferred<void>();
    const { pushManager } = stubPushBrowser({ permission: "default", requestPermission: async () => "granted" });
    mocks.register.mockImplementation(() => api.promise);
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: true }));

    let running!: Promise<void>;
    act(() => {
      running = result.current.enable();
    });
    await waitFor(() => expect(mocks.register).toHaveBeenCalled());
    await act(async () => {
      api.resolve();
      await running;
    });

    expect(mocks.register).toHaveBeenCalledTimes(1);
    expect(pushManager.subscribe).toHaveBeenCalledTimes(1);
  });

  it("refreshPermission re-reads Notification.permission", async () => {
    const { notification } = stubPushBrowser({ permission: "default", requestPermission: async () => "default" });
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: false }));
    await act(async () => {});
    expect(result.current.permission).toBe("default");

    notification.permission = "granted";
    act(() => result.current.refreshPermission());
    expect(result.current.permission).toBe("granted");
  });

  it("supported is true with the Push API, canSubscribe and a VAPID key", async () => {
    stubPushBrowser({ permission: "denied", requestPermission: async () => "denied" });
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: true }));
    await act(async () => {});
    expect(result.current.supported).toBe(true);
  });

  it("supported is false with no PushManager", async () => {
    stubPushBrowser({ permission: "denied", requestPermission: async () => "denied", pushManager: false });
    expect("PushManager" in window).toBe(false);
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: true }));
    await act(async () => {});
    expect(result.current.supported).toBe(false);
  });

  it("supported is false with canSubscribe false", async () => {
    stubPushBrowser({ permission: "denied", requestPermission: async () => "denied" });
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: false }));
    await act(async () => {});
    expect(result.current.supported).toBe(false);
  });

  it("supported is false with an empty VAPID key", async () => {
    stubPushBrowser({ permission: "denied", requestPermission: async () => "denied" });
    mocks.env.VAPID_PUBLIC_KEY = "  ";
    const { result } = renderHook(() => usePushNotifications({ currentUser: user, canSubscribe: true }));
    await act(async () => {});
    expect(result.current.supported).toBe(false);
  });

  it("the first render reports supported false and permission default", () => {
    stubPushBrowser({ permission: "granted", requestPermission: async () => "granted" });
    let captured: PushNotificationsState | undefined;
    function Capture() {
      captured = usePushNotifications({ currentUser: user, canSubscribe: true });
      return null;
    }
    renderToString(<Capture />);
    expect(captured).toMatchObject({ supported: false, permission: "default", busy: false });
  });
});

describe("unsubscribeFromPush", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function stubSubscription(unsubscribe: () => Promise<boolean>) {
    const subscription = { unsubscribe: vi.fn(unsubscribe) };
    const getRegistration = vi.fn(async () => ({
      pushManager: { getSubscription: vi.fn(async () => subscription) },
    }));
    vi.stubGlobal("navigator", { serviceWorker: { getRegistration } });
    return { subscription, getRegistration };
  }

  it("removes every push_registered_ key before unsubscribing and keeps other keys", async () => {
    sessionStorage.setItem(`${PUSH_REGISTERED_KEY_PREFIX}u1`, "h1");
    sessionStorage.setItem(`${PUSH_REGISTERED_KEY_PREFIX}u2`, "h2");
    sessionStorage.setItem("other", "keep");
    let keysAtUnsubscribe: string[] = [];
    stubSubscription(async () => {
      keysAtUnsubscribe = Object.keys(sessionStorage);
      return true;
    });

    await unsubscribeFromPush();

    expect(keysAtUnsubscribe).toEqual(["other"]);
    expect(sessionStorage.getItem("other")).toBe("keep");
  });

  it("calls subscription.unsubscribe()", async () => {
    const { subscription } = stubSubscription(async () => true);
    await unsubscribeFromPush();
    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("resolves when getRegistration throws, with the keys already cleared", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.setItem(`${PUSH_REGISTERED_KEY_PREFIX}u1`, "h1");
    vi.stubGlobal("navigator", {
      serviceWorker: { getRegistration: vi.fn().mockRejectedValue(new Error("boom")) },
    });
    await expect(unsubscribeFromPush()).resolves.toBeUndefined();
    expect(sessionStorage.getItem(`${PUSH_REGISTERED_KEY_PREFIX}u1`)).toBeNull();
    error.mockRestore();
  });

  it("resolves when unsubscribe throws, with the keys already cleared", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.setItem(`${PUSH_REGISTERED_KEY_PREFIX}u1`, "h1");
    const { subscription } = stubSubscription(() => Promise.reject(new Error("push service down")));
    await expect(unsubscribeFromPush()).resolves.toBeUndefined();
    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(`${PUSH_REGISTERED_KEY_PREFIX}u1`)).toBeNull();
    error.mockRestore();
  });

  it("a hanging unsubscribe resolves after 2 s", async () => {
    vi.useFakeTimers();
    sessionStorage.setItem(`${PUSH_REGISTERED_KEY_PREFIX}u1`, "h1");
    const { subscription } = stubSubscription(() => new Promise<boolean>(() => {}));

    let done = false;
    const running = unsubscribeFromPush().then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(1999);
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(done).toBe(false);
    expect(sessionStorage.getItem(`${PUSH_REGISTERED_KEY_PREFIX}u1`)).toBeNull();

    vi.advanceTimersByTime(1);
    await running;
    expect(done).toBe(true);
  });
});
