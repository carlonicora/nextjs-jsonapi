import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";

vi.mock("cookies-next", () => ({
  getCookie: vi.fn(() => undefined),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const socketMock = vi.hoisted(() => {
  const handlers: Record<string, ((data: any) => void)[]> = {};
  return {
    socket: {
      on: (event: string, handler: (data: any) => void) => {
        (handlers[event] ??= []).push(handler);
      },
      off: (event: string, handler: (data: any) => void) => {
        handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
      },
    },
    emit: (event: string, data: any) => {
      (handlers[event] ?? []).forEach((h) => h(data));
    },
    reset: () => {
      for (const key of Object.keys(handlers)) delete handlers[key];
    },
  };
});

vi.mock("../../../../contexts/SocketContext", () => ({
  useSocketContext: () => ({ socket: socketMock.socket, isConnected: true }),
}));

vi.mock("../../../../core", () => {
  // Mirrors the real Company model: public getters over private backing fields.
  // The token overlay writes the backing fields, so a plain object would not
  // exercise it.
  class FakeCompany {
    id = "";
    monthlyTokens = 0;
    _availableMonthlyTokens = 0;
    _availableExtraTokens = 0;
    get availableMonthlyTokens() {
      return this._availableMonthlyTokens ?? 0;
    }
    get availableExtraTokens() {
      return this._availableExtraTokens ?? 0;
    }
  }
  return {
    Modules: { User: { name: "users" } },
    rehydrate: (_module: unknown, data: any) => ({
      ...data,
      company: data.company ? Object.assign(new FakeCompany(), data.company) : null,
    }),
  };
});

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

describe("CurrentUserProvider token updates", () => {
  const STORED_USER = {
    id: "user-1",
    roles: [],
    modules: [],
    company: {
      id: "company-1",
      monthlyTokens: 1000,
      _availableMonthlyTokens: 900,
      _availableExtraTokens: 50,
    },
  };

  function CompanyConsumer() {
    const { company } = useCurrentUserContext();
    return (
      <div data-testid="balances">
        {company ? `${(company as any).availableMonthlyTokens}/${(company as any).availableExtraTokens}` : "null"}
      </div>
    );
  }

  beforeEach(() => {
    localStorage.clear();
    socketMock.reset();
    vi.clearAllMocks();
  });

  it("patches balances from company:tokens_updated without refetching the user", async () => {
    localStorage.setItem("user", JSON.stringify(STORED_USER));

    const { getByTestId } = render(
      <CurrentUserProvider>
        <CompanyConsumer />
      </CurrentUserProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getByTestId("balances").textContent).toBe("900/50");

    await act(async () => {
      socketMock.emit("company:tokens_updated", {
        type: "company:tokens_updated",
        companyId: "company-1",
        availableMonthlyTokens: 750,
        availableExtraTokens: 40,
      });
    });

    expect(getByTestId("balances").textContent).toBe("750/40");
    expect(UserService.findFullUser).not.toHaveBeenCalled();
  });

  it("ignores company:tokens_updated for a different company", async () => {
    localStorage.setItem("user", JSON.stringify(STORED_USER));

    const { getByTestId } = render(
      <CurrentUserProvider>
        <CompanyConsumer />
      </CurrentUserProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    await act(async () => {
      socketMock.emit("company:tokens_updated", {
        type: "company:tokens_updated",
        companyId: "someone-else",
        availableMonthlyTokens: 1,
        availableExtraTokens: 1,
      });
    });

    expect(getByTestId("balances").textContent).toBe("900/50");
  });

  it("still refetches the full user on company:subscription_updated", async () => {
    localStorage.setItem("user", JSON.stringify(STORED_USER));
    vi.mocked(UserService.findFullUser).mockResolvedValue({
      ...STORED_USER,
      dehydrate: () => STORED_USER,
    } as any);

    render(
      <CurrentUserProvider>
        <CompanyConsumer />
      </CurrentUserProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    await act(async () => {
      socketMock.emit("company:subscription_updated", {
        type: "company:subscription_updated",
        companyId: "company-1",
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(UserService.findFullUser).toHaveBeenCalledTimes(1);
  });
});
