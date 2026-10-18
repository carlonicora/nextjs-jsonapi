import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = {
    cookies: {} as Record<string, string>,
    deviceType: undefined as string | undefined,
  };
  return {
    state,
    cookies: vi.fn(async () => ({
      get: (name: string) => (name in state.cookies ? { name, value: state.cookies[name] } : undefined),
    })),
    headers: vi.fn(async () => new Headers()),
    userAgent: vi.fn(() => ({ device: { type: state.deviceType } })),
  };
});

vi.mock("next/headers", () => ({ cookies: mocks.cookies, headers: mocks.headers }));
vi.mock("next/server", () => ({ userAgent: mocks.userAgent }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { configureRoles } from "../../roles/config";
import { ServerSession } from "../ServerSession";

describe("ServerSession.read", () => {
  beforeEach(() => {
    configureRoles({ Administrator: "role-admin", CompanyAdministrator: "role-company-admin" });
    mocks.state.cookies = {};
    mocks.state.deviceType = undefined;
  });

  it("reads a logged-in administrator on a desktop with the sidebar closed", async () => {
    mocks.state.cookies = {
      token: "t1",
      roles: "role-admin,role-x",
      sidebar_state: "false",
      viewport_mobile: "0",
    };

    await expect(ServerSession.read()).resolves.toEqual({
      isLogged: true,
      isAdministrator: true,
      token: "t1",
      sidebarOpen: false,
      isMobile: false,
    });
  });

  it("falls back to the user agent when the viewport cookie is missing", async () => {
    mocks.state.cookies = { token: "t1" };
    mocks.state.deviceType = "mobile";

    const snapshot = await ServerSession.read();

    expect(snapshot.isMobile).toBe(true);
  });

  it("reads a logged-out visitor", async () => {
    await expect(ServerSession.read()).resolves.toEqual({
      isLogged: false,
      isAdministrator: false,
      token: undefined,
      sidebarOpen: true,
      isMobile: false,
    });
  });
});
