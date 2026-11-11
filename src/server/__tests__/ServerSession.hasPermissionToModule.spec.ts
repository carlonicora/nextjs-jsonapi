import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `hasPermissionToModule` reads the user's modules from `UserService.findFullUser()`,
 * never from a `modules` cookie: a non-admin user's scoped permissions made that
 * cookie larger than the browser's 4096-byte limit, so it was dropped and every
 * check denied. No test here sets a `modules` cookie.
 */
const mocks = vi.hoisted(() => ({
  cookies: {} as Record<string, string>,
  findFullUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name in mocks.cookies ? { name, value: mocks.cookies[name] } : undefined),
  }),
  headers: async () => new Headers(),
}));
vi.mock("next/server", () => ({ userAgent: vi.fn(() => ({ device: {} })) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("../../features/user/data/user.service", () => ({
  UserService: { findFullUser: mocks.findFullUser },
}));

import { Action, type ModuleWithPermissions } from "../../permissions";
import { ServerSession } from "../ServerSession";

const MODULE = { name: "proceedings", model: class {}, moduleId: "module-proceeding" } as ModuleWithPermissions;

const userWith = (permissions: Record<string, boolean | string>) => ({
  id: "user-1",
  modules: [
    {
      id: "module-proceeding",
      permissions: { create: false, read: false, update: false, delete: false, ...permissions },
    },
  ],
});

describe("ServerSession.hasPermissionToModule", () => {
  beforeEach(() => {
    mocks.cookies = { userId: "user-1" };
    mocks.findFullUser.mockReset();
  });

  it("allows read when the full user's module grants read: true", async () => {
    mocks.findFullUser.mockResolvedValue(userWith({ read: true }));

    await expect(ServerSession.hasPermissionToModule({ module: MODULE, action: Action.Read })).resolves.toBe(true);
    expect(mocks.findFullUser).toHaveBeenCalled();
  });

  it("allows read for a scoped permission when no data is passed", async () => {
    mocks.findFullUser.mockResolvedValue(userWith({ read: "owner|proceeding.owner|proceeding.users" }));

    await expect(ServerSession.hasPermissionToModule({ module: MODULE, action: Action.Read })).resolves.toBe(true);
  });

  it("denies when the full user lacks the module", async () => {
    mocks.findFullUser.mockResolvedValue({ id: "user-1", modules: [] });

    await expect(ServerSession.hasPermissionToModule({ module: MODULE, action: Action.Read })).resolves.toBe(false);
  });

  it("denies without loading the user when the features cookie lacks the module's feature", async () => {
    mocks.cookies.features = JSON.stringify(["feature-other"]);
    mocks.findFullUser.mockResolvedValue(userWith({ read: true }));

    await expect(
      ServerSession.hasPermissionToModule({
        module: { ...MODULE, feature: "feature-proceedings" } as ModuleWithPermissions,
        action: Action.Read,
      }),
    ).resolves.toBe(false);
    expect(mocks.findFullUser).not.toHaveBeenCalled();
  });
});
