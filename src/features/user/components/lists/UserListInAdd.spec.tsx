import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useMemo, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Two users whose row text is identical (same name, same e-mail — e.g. a re-invited
// duplicate): cmdk derives an item's value from its text when no `value` is given, so
// without a unique value both rows highlight together.
const users = [
  { id: "u1", name: "Mario Rossi", email: "mario@example.com" },
  { id: "u2", name: "Mario Rossi", email: "mario@example.com" },
  { id: "u3", name: "Anna Bianchi", email: "anna@example.com" },
];

const { searchSpy } = vi.hoisted(() => ({ searchSpy: vi.fn() }));

vi.mock("../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../hooks")>()),
  useDebounce: (fn: any) => fn,
}));
vi.mock("../widgets", () => ({ UserAvatar: () => null }));

import { CommonAssociationCommandDialog } from "../../../../components/forms/CommonAssociationForm";
import { UserListInAdd } from "./UserListInAdd";

// The list is always rendered inside CommonAssociationCommandDialog (see RoleUserAdd),
// which owns the search input; `search(term)` stands in for the server-side search.
function Host({ setSelectedUser }: { setSelectedUser: (user: any) => void }) {
  const [list, setList] = useState<any[]>(users);
  const search = useCallback(async (term: string) => {
    searchSpy(term);
    setList(users.filter((u) => u.name.toLowerCase().includes(term.toLowerCase())));
  }, []);
  const data = useMemo(() => ({ data: list, search }) as any, [list, search]);
  return (
    <CommonAssociationCommandDialog
      show={true}
      setShow={vi.fn()}
      data={data}
      source="users"
      destination="roles"
      destinationName="Admin"
    >
      <UserListInAdd data={data} existingUsers={[]} setSelectedUser={setSelectedUser} />
    </CommonAssociationCommandDialog>
  );
}

describe("UserListInAdd", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    searchSpy.mockReset();
  });

  it("highlights only one of two same-text users and selects the one clicked", async () => {
    const setSelectedUser = vi.fn();
    render(<Host setSelectedUser={setSelectedUser} />);
    const list = await screen.findByRole("listbox");
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    const highlighted = within(list)
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(highlighted).toHaveLength(1);

    const sameText = within(list).getAllByRole("option", { name: /Mario Rossi/ });
    expect(sameText).toHaveLength(2);
    await userEvent.click(sameText[1]);
    expect(setSelectedUser).toHaveBeenCalled();
    expect(setSelectedUser.mock.calls.every(([u]) => u.id === "u2")).toBe(true);
  });

  it("still filters the list when the user types", async () => {
    render(<Host setSelectedUser={vi.fn()} />);
    const list = await screen.findByRole("listbox");
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    await userEvent.type(screen.getByRole("combobox"), "anna");

    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith("anna"));
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1));
    expect(within(list).getByRole("option", { name: /Anna Bianchi/ })).toBeInTheDocument();
  });
});
