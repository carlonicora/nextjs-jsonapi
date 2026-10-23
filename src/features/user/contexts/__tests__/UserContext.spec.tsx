import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSharedContext } from "../../../../contexts/SharedContext";
import { UserProvider } from "../UserContext";

const access = vi.hoisted(() => ({ isAdministrator: false, canUpdateUsers: false }));

vi.mock("../CurrentUserContext", () => ({
  useCurrentUserContext: () => ({
    hasRole: (roleId: string) => access.isAdministrator && roleId === "administrator",
    hasPermissionToModule: () => access.canUpdateUsers,
  }),
}));

vi.mock("../../../../roles", () => ({
  getRoleId: () => ({ Administrator: "administrator" }),
}));

// The title functions are not under test; the real forms pull in the editor stack.
vi.mock("../../components/forms", () => ({
  UserDeleter: () => null,
  UserEditor: () => null,
  UserReactivator: () => null,
  UserResentInvitationEmail: () => null,
}));

// The registry throws for modules nobody registered. The dehydrated user is
// handed back as-is so the spec does not depend on the User model.
vi.mock("../../../../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../core")>();
  return {
    ...actual,
    Modules: { User: { name: "users", pageUrl: "/users" } },
    rehydrate: (_module: unknown, data: unknown) => data,
  };
});

// next-intl is globally mocked in vitest.setup.ts with `t = (key) => key`, so a
// translated label renders as its own key.
function BreadcrumbProbe() {
  const { breadcrumbs } = useSharedContext();
  return <span data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</span>;
}

const user = { id: "u1", name: "Ada", isDeleted: false, isActivated: true } as any;

const renderBreadcrumbs = (dehydratedUser?: any) => {
  render(
    <UserProvider dehydratedUser={dehydratedUser}>
      <BreadcrumbProbe />
    </UserProvider>,
  );
  return JSON.parse(screen.getByTestId("breadcrumbs").textContent ?? "[]");
};

describe("UserContext breadcrumb", () => {
  beforeEach(() => {
    access.isAdministrator = false;
    access.canUpdateUsers = false;
  });

  it("shows an administrator the users list as an unlinked root, even without the module permission", () => {
    access.isAdministrator = true;

    expect(renderBreadcrumbs()).toEqual([{ name: "entities.users" }]);
  });

  it("links an administrator's user detail back to the administration users list", () => {
    access.isAdministrator = true;

    expect(renderBreadcrumbs(user)).toEqual([
      { name: "entities.users", href: "/administration/users" },
      { name: "Ada", href: "/users/u1" },
    ]);
  });

  it("shows a user manager the company users list as an unlinked root", () => {
    access.canUpdateUsers = true;

    expect(renderBreadcrumbs()).toEqual([{ name: "entities.users" }]);
  });

  it("links a user manager's user detail back to the company users list", () => {
    access.canUpdateUsers = true;

    expect(renderBreadcrumbs(user)).toEqual([
      { name: "entities.users", href: "/users" },
      { name: "Ada", href: "/users/u1" },
    ]);
  });

  it("shows only the user to a viewer who can neither manage users nor administer", () => {
    expect(renderBreadcrumbs(user)).toEqual([{ name: "Ada", href: "/users/u1" }]);
  });
});
