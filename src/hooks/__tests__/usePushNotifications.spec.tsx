import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import usePushNotifications from "../usePushNotifications";

// Hoisted so the vi.mock factories below can read it (Vitest hoists factories
// above module-scope consts).
const state = vi.hoisted(() => ({ isProduction: false }));

vi.mock("../../core/env", () => ({
  ENV: {
    get IS_PRODUCTION() {
      return state.isProduction;
    },
    VAPID_PUBLIC_KEY: "",
  },
}));

vi.mock("../../contexts", () => ({
  useCurrentUserContext: () => ({
    currentUser: { id: "user-1" },
    hasRole: () => false,
  }),
}));

vi.mock("../../features/push/data/push.service", () => ({
  PushService: { register: vi.fn() },
}));

vi.mock("../../roles", () => ({
  getRoleId: () => ({ Administrator: "administrator" }),
}));

vi.mock("../../client/config", () => ({
  getAppUrl: () => "http://app.test",
}));

function Probe() {
  usePushNotifications();
  return null;
}

describe("usePushNotifications worker URL", () => {
  const register = vi.fn().mockResolvedValue({ pushManager: { getSubscription: vi.fn() } });

  beforeEach(() => {
    register.mockClear();
    vi.stubGlobal("navigator", { serviceWorker: { register, ready: Promise.resolve() } });
    vi.stubGlobal("PushManager", function PushManager() {});
    // "denied" makes the hook return right after registering, so this spec
    // proves only the URL choice and nothing about subscription handling.
    vi.stubGlobal("Notification", { permission: "denied", requestPermission: vi.fn() });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers the push-only dev worker outside production", async () => {
    state.isProduction = false;
    render(<Probe />);
    await waitFor(() => expect(register).toHaveBeenCalledWith("http://app.test/sw-dev.js"));
  });

  it("registers the full worker in production", async () => {
    state.isProduction = true;
    render(<Probe />);
    await waitFor(() => expect(register).toHaveBeenCalledWith("http://app.test/sw.js"));
  });
});
