import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { Logout } from "../Logout";

// Mock the dependencies
vi.mock("../../../../../hooks", () => ({
  usePageUrlGenerator:
    () =>
    ({ page }: { page: string }) =>
      page,
}));

vi.mock("../../../data/auth.service", () => ({
  AuthService: {
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../utils/clearClientStorage", () => ({
  clearClientStorage: vi.fn(),
}));

vi.mock("../../../../../hooks/usePushNotifications", () => ({
  unsubscribeFromPush: vi.fn().mockResolvedValue(undefined),
}));

// Import mocked modules for assertions
import { CURRENT_USER_STORAGE_KEY } from "../../../../user/data/user.storage";
import { AuthService } from "../../../data/auth.service";
import { clearClientStorage } from "../../../utils/clearClientStorage";
import { unsubscribeFromPush } from "../../../../../hooks/usePushNotifications";

describe("Logout", () => {
  let windowLocationHref: string;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(unsubscribeFromPush).mockResolvedValue(undefined);
    windowLocationHref = "";

    // Mock window.location.href using Object.defineProperty on window.location
    // We need to delete the original location first
    // @ts-expect-error - deleting window.location for mocking purposes
    delete window.location;
    // The DOM lib types `window.location` as accessor-only; jsdom lets the test replace it.
    (window as unknown as { location: Location }).location = {
      ...originalLocation,
      get href() {
        return windowLocationHref;
      },
      set href(value: string) {
        windowLocationHref = value;
      },
    } as Location;
  });

  afterEach(() => {
    // Restore original location
    (window as unknown as { location: Location }).location = originalLocation;
  });

  describe("Scenario: Clears storage when storageKeys provided", () => {
    it("should call clearClientStorage with the user key plus the provided keys, before AuthService.logout", async () => {
      const storageKeys = ["person", "recentPages"];
      const callOrder: string[] = [];

      vi.mocked(clearClientStorage).mockImplementation(() => {
        callOrder.push("clearClientStorage");
      });
      vi.mocked(AuthService.logout).mockImplementation(async () => {
        callOrder.push("AuthService.logout");
      });

      render(<Logout storageKeys={storageKeys} />);

      await waitFor(() => {
        expect(clearClientStorage).toHaveBeenCalledWith([CURRENT_USER_STORAGE_KEY, ...storageKeys]);
      });

      expect(AuthService.logout).toHaveBeenCalled();
      expect(callOrder[0]).toBe("clearClientStorage");
      expect(callOrder[1]).toBe("AuthService.logout");
    });

    it("should redirect to home page after logout", async () => {
      const storageKeys = ["person"];

      render(<Logout storageKeys={storageKeys} />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
    });
  });

  // The persisted user belongs to this library, not to the consuming app: leaving
  // it behind makes the client keep rendering a signed-in UI after the cookies are
  // gone. Clearing it must never depend on the caller remembering to ask.
  describe("Scenario: Always clears the persisted current user", () => {
    it("should call clearClientStorage with the user key when storageKeys is not provided", async () => {
      render(<Logout />);

      await waitFor(() => {
        expect(AuthService.logout).toHaveBeenCalled();
      });

      expect(clearClientStorage).toHaveBeenCalledWith([CURRENT_USER_STORAGE_KEY]);
    });

    it("should call clearClientStorage with the user key when storageKeys is an empty array", async () => {
      render(<Logout storageKeys={[]} />);

      await waitFor(() => {
        expect(AuthService.logout).toHaveBeenCalled();
      });

      expect(clearClientStorage).toHaveBeenCalledWith([CURRENT_USER_STORAGE_KEY]);
    });

    it("should still redirect to home page without storageKeys", async () => {
      render(<Logout />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
    });
  });

  // Offline mode: the app may hold unsent changes on the device, so it gets a
  // chance to warn (or cancel) before anything is cleared.
  describe("Scenario: beforeLogout hook", () => {
    it("awaits beforeLogout and stops when it returns false", async () => {
      let resolveHook: (value: boolean) => void = () => {};
      const beforeLogout = vi.fn(
        () =>
          new Promise<boolean>((resolve) => {
            resolveHook = resolve;
          }),
      );

      render(<Logout beforeLogout={beforeLogout} />);

      await waitFor(() => {
        expect(beforeLogout).toHaveBeenCalledTimes(1);
      });
      expect(clearClientStorage).not.toHaveBeenCalled();
      expect(AuthService.logout).not.toHaveBeenCalled();

      resolveHook(false);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(clearClientStorage).not.toHaveBeenCalled();
      expect(AuthService.logout).not.toHaveBeenCalled();
      expect(windowLocationHref).toBe("");
    });

    it("clears storage and logs out when it returns true or is absent", async () => {
      const callOrder: string[] = [];
      const beforeLogout = vi.fn(async () => {
        callOrder.push("beforeLogout");
        return true;
      });
      vi.mocked(clearClientStorage).mockImplementation(() => {
        callOrder.push("clearClientStorage");
      });
      vi.mocked(AuthService.logout).mockImplementation(async () => {
        callOrder.push("AuthService.logout");
      });

      const { unmount } = render(<Logout beforeLogout={beforeLogout} storageKeys={["person"]} />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
      expect(callOrder).toEqual(["beforeLogout", "clearClientStorage", "AuthService.logout"]);
      expect(clearClientStorage).toHaveBeenCalledWith([CURRENT_USER_STORAGE_KEY, "person"]);
      unmount();

      vi.clearAllMocks();
      windowLocationHref = "";
      render(<Logout />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
      expect(clearClientStorage).toHaveBeenCalledWith([CURRENT_USER_STORAGE_KEY]);
      expect(AuthService.logout).toHaveBeenCalledTimes(1);
    });
  });

  // A device that logs out must stop receiving pushes meant for that user.
  describe("Scenario: Unsubscribes from browser push", () => {
    it("unsubscribes before logging out", async () => {
      const callOrder: string[] = [];
      const beforeLogout = vi.fn(async () => {
        callOrder.push("beforeLogout");
        return true;
      });
      vi.mocked(unsubscribeFromPush).mockImplementation(async () => {
        callOrder.push("unsubscribeFromPush");
      });
      vi.mocked(clearClientStorage).mockImplementation(() => {
        callOrder.push("clearClientStorage");
      });
      vi.mocked(AuthService.logout).mockImplementation(async () => {
        callOrder.push("AuthService.logout");
      });

      render(<Logout beforeLogout={beforeLogout} />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
      expect(callOrder).toEqual(["beforeLogout", "unsubscribeFromPush", "clearClientStorage", "AuthService.logout"]);
    });

    it("a cancelled beforeLogout does not unsubscribe", async () => {
      const beforeLogout = vi.fn(async () => false);

      render(<Logout beforeLogout={beforeLogout} />);

      await waitFor(() => {
        expect(beforeLogout).toHaveBeenCalledTimes(1);
      });
      await act(async () => {});

      expect(unsubscribeFromPush).not.toHaveBeenCalled();
      expect(AuthService.logout).not.toHaveBeenCalled();
      expect(windowLocationHref).toBe("");
    });

    it("logout still completes when unsubscribeFromPush rejects", async () => {
      vi.mocked(unsubscribeFromPush).mockRejectedValue(new Error("push service down"));

      render(<Logout />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
      expect(unsubscribeFromPush).toHaveBeenCalledTimes(1);
      expect(AuthService.logout).toHaveBeenCalledTimes(1);
    });
  });

  // The real unsubscribeFromPush behind Logout: the browser's unsubscribe fails or hangs.
  describe("Scenario: Logout with a failing or hanging browser unsubscribe", () => {
    const KEY = "push_registered_u1";

    function stubBrowserUnsubscribe(unsubscribe: () => Promise<boolean>) {
      const subscription = { unsubscribe: vi.fn(unsubscribe) };
      vi.stubGlobal("navigator", {
        serviceWorker: {
          getRegistration: vi.fn(async () => ({
            pushManager: { getSubscription: vi.fn(async () => subscription) },
          })),
        },
      });
      return subscription;
    }

    beforeEach(async () => {
      const actual = await vi.importActual<typeof import("../../../../../hooks/usePushNotifications")>(
        "../../../../../hooks/usePushNotifications",
      );
      vi.mocked(unsubscribeFromPush).mockImplementation(actual.unsubscribeFromPush);
      sessionStorage.setItem(KEY, "h1");
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      sessionStorage.clear();
    });

    it("a throwing unsubscribe still logs out, with the push keys cleared", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const subscription = stubBrowserUnsubscribe(() => Promise.reject(new Error("push service down")));

      render(<Logout />);

      await waitFor(() => {
        expect(windowLocationHref).toBe("/");
      });
      expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(KEY)).toBeNull();
      expect(AuthService.logout).toHaveBeenCalledTimes(1);
      error.mockRestore();
    });

    it("a hanging unsubscribe does not hold logout past 2 s, with the push keys cleared", async () => {
      vi.useFakeTimers();
      stubBrowserUnsubscribe(() => new Promise<boolean>(() => {}));

      render(<Logout />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1999);
      });
      expect(sessionStorage.getItem(KEY)).toBeNull();
      expect(AuthService.logout).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(AuthService.logout).toHaveBeenCalledTimes(1);
      expect(windowLocationHref).toBe("/");
    });
  });
});
