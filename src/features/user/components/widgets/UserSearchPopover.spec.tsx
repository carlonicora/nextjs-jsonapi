import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Two users with the SAME name: cmdk derives an item's value from its text when no
// `value` is given, so without a unique value both rows highlight together.
const users = [
  { id: "u1", name: "Mario Rossi" },
  { id: "u2", name: "Mario Rossi" },
  { id: "u3", name: "Anna Bianchi" },
];

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

// The real useUserSearch runs; only the API call underneath it is stubbed.
vi.mock("../../data/user.service", () => ({ UserService: { findMany } }));
vi.mock("./UserAvatar", () => ({ UserAvatar: () => null }));

import { UserSearchPopover } from "./UserSearchPopover";

async function openList(onSelect = vi.fn()) {
  render(
    <UserSearchPopover onSelect={onSelect}>
      <span>open</span>
    </UserSearchPopover>,
  );
  await userEvent.click(screen.getByText("open"));
  return screen.findByRole("listbox");
}

describe("UserSearchPopover", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    findMany.mockReset();
    findMany.mockImplementation(async (params: { search?: string }) =>
      users.filter((u) => u.name.toLowerCase().includes((params.search ?? "").toLowerCase())),
    );
  });

  it("highlights only one of two same-named users and selects the one clicked", async () => {
    const onSelect = vi.fn();
    const list = await openList(onSelect);
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    const highlighted = within(list)
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(highlighted).toHaveLength(1);

    const sameNamed = within(list).getAllByRole("option", { name: "Mario Rossi" });
    expect(sameNamed).toHaveLength(2);
    await userEvent.click(sameNamed[1]);
    expect(onSelect).toHaveBeenCalledWith("u2");
  });

  it("still filters the list when the user types", async () => {
    const list = await openList();
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    await userEvent.type(screen.getByRole("textbox"), "anna");

    await waitFor(() => expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ search: "anna" })), {
      timeout: 3000,
    });
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1), { timeout: 3000 });
    expect(within(list).getByRole("option", { name: "Anna Bianchi" })).toBeInTheDocument();
  });
});
