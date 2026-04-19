import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("cookies-next", () => ({
  getCookie: vi.fn(() => undefined),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("../../../../contexts/SocketContext", () => ({
  useSocketContext: () => ({ socket: null, isConnected: false }),
}));

vi.mock("../../../../core", () => ({
  Modules: { User: { name: "users" } },
  rehydrate: (_module: unknown, data: any) => data,
}));

vi.mock("../../../../permissions", () => ({
  Action: { Read: "read", Write: "write", Create: "create", Update: "update", Delete: "delete" },
  checkPermissions: () => true,
}));

vi.mock("../../../../roles", () => ({
  getRoleId: () => ({ Administrator: "admin" }),
}));

vi.mock("../../../auth/config", () => ({
  getTokenHandler: vi.fn(() => ({
    updateToken: vi.fn().mockResolvedValue(undefined),
    removeToken: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../../data", () => ({
  UserService: {
    findFullUser: vi.fn(),
  },
}));

import { CurrentUserProvider, useCurrentUserContext } from "../CurrentUserContext";
import { getCookie } from "cookies-next";
import { getTokenHandler } from "../../../auth/config";
import { UserService } from "../../data";

function Consumer() {
  const { currentUser } = useCurrentUserContext();
  return <div data-testid="current-user-id">{currentUser ? (currentUser as { id: string }).id : "null"}</div>;
}

describe("CurrentUserProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("keeps user hydrated from localStorage when token cookie is absent", async () => {
    const storedUser = {
      id: "user-1",
      roles: [],
      company: null,
      modules: [],
    };
    localStorage.setItem("user", JSON.stringify(storedUser));
    vi.mocked(getCookie).mockReturnValue(undefined);

    const { getByTestId } = render(
      <CurrentUserProvider>
        <Consumer />
      </CurrentUserProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(getByTestId("current-user-id").textContent).toBe("user-1");
    expect(localStorage.getItem("user")).toBe(JSON.stringify(storedUser));
  });

  it("awaits updateToken before writing the user atom in refreshUser", async () => {
    const oldUser = { id: "old", roles: [], company: null, modules: [] };
    localStorage.setItem("user", JSON.stringify(oldUser));

    const newDehydrated = { id: "new", roles: [], company: null, modules: [] };
    const newFullUser = {
      id: "new",
      roles: [],
      company: null,
      modules: [],
      dehydrate: () => newDehydrated,
    };
    vi.mocked(UserService.findFullUser).mockResolvedValue(newFullUser as any);

    let resolveUpdateToken!: () => void;
    const updateTokenPromise = new Promise<void>((resolve) => {
      resolveUpdateToken = resolve;
    });
    const updateToken = vi.fn(async () => {
      await updateTokenPromise;
    });
    vi.mocked(getTokenHandler).mockReturnValue({
      updateToken,
      removeToken: vi.fn().mockResolvedValue(undefined),
    } as any);

    let capturedRefreshUser: ((options?: { skipCookieUpdate?: boolean }) => Promise<void>) | undefined;
    function InnerConsumer() {
      const ctx = useCurrentUserContext();
      capturedRefreshUser = ctx.refreshUser;
      return (
        <div data-testid="current-user-id">{ctx.currentUser ? (ctx.currentUser as { id: string }).id : "null"}</div>
      );
    }

    const { getByTestId } = render(
      <CurrentUserProvider>
        <InnerConsumer />
      </CurrentUserProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getByTestId("current-user-id").textContent).toBe("old");

    expect(capturedRefreshUser).toBeDefined();
    const refreshPromise = capturedRefreshUser!();

    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(updateToken).toHaveBeenCalledTimes(1);
    expect(getByTestId("current-user-id").textContent).toBe("old");

    resolveUpdateToken();
    await refreshPromise;

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getByTestId("current-user-id").textContent).toBe("new");
  });
});
