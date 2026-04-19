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
  return (
    <div data-testid="current-user-id">
      {currentUser ? (currentUser as { id: string }).id : "null"}
    </div>
  );
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
});
