import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Every row's text is `t("role.roles", { role })`. A role id the translation does not
// know renders the same fallback text, so two roles can share a row text — and cmdk,
// without a `value`, derives the value from that text and highlights both rows.
// (The test translator returns the key, so every row reads "role.roles".)
const roles = [
  { id: "role-a", name: "Role A" },
  { id: "role-b", name: "Role B" },
  { id: "role-c", name: "Role C" },
];

const { findAllRolesUserNotIn, addUserToRole } = vi.hoisted(() => ({
  findAllRolesUserNotIn: vi.fn(),
  addUserToRole: vi.fn(),
}));

vi.mock("../../data/role.service", () => ({ RoleService: { findAllRolesUserNotIn, addUserToRole } }));
vi.mock("../../../../utils/toast", () => ({ showToast: vi.fn() }));
vi.mock("../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../hooks")>()),
  useDebounce: (fn: any) => fn,
}));

import { UserRoleAdd } from "./UserRoleAdd";

const user = { id: "user-1", name: "Mario Rossi" } as any;

async function openList() {
  render(<UserRoleAdd user={user} refresh={vi.fn(async () => {})} />);
  await userEvent.click(screen.getByRole("button", { name: /common.association.label/ }));
  return screen.findByRole("listbox");
}

describe("UserRoleAdd", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    findAllRolesUserNotIn.mockReset();
    addUserToRole.mockReset();
    findAllRolesUserNotIn.mockImplementation(async (params: { search: string }) =>
      roles.filter((r) => r.id.includes(params.search)),
    );
    addUserToRole.mockResolvedValue(undefined);
  });

  it("highlights only one of two same-text roles and adds the one clicked", async () => {
    const list = await openList();
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    const highlighted = within(list)
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(highlighted).toHaveLength(1);

    await userEvent.click(within(list).getAllByRole("option")[1]);
    await waitFor(() => expect(addUserToRole).toHaveBeenCalled());
    expect(addUserToRole.mock.calls.every(([p]) => p.roleId === "role-b" && p.userId === "user-1")).toBe(true);
  });

  it("still filters the list when the user types", async () => {
    const list = await openList();
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    await userEvent.type(screen.getByRole("combobox"), "role-c");

    await waitFor(() => expect(findAllRolesUserNotIn).toHaveBeenCalledWith({ search: "role-c", userId: "user-1" }));
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1));
  });
});
