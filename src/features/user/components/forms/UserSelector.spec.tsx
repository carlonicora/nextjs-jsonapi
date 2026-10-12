import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Two users with the SAME name: cmdk derives an item's value from its text when no
// `value` is given, so without a unique value both rows highlight together.
const users = [
  { id: "u1", name: "Mario Rossi", avatar: "a1" },
  { id: "u2", name: "Mario Rossi", avatar: "a2" },
  { id: "u3", name: "Anna Bianchi", avatar: "a3" },
];

const { searchSpy } = vi.hoisted(() => ({ searchSpy: vi.fn() }));

vi.mock("../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../hooks")>()),
  // Stands in for the server-side search: `search(term)` narrows the list by name.
  useDataListRetriever: () => {
    const [data, setData] = useState<any[]>(users);
    const search = useCallback(async (term: string) => {
      searchSpy(term);
      setData(users.filter((u) => u.name.toLowerCase().includes(term.toLowerCase())));
    }, []);
    return useMemo(() => ({ data, search }), [data, search]);
  },
  useDebounce: (fn: any) => fn,
}));
vi.mock("../widgets", () => ({ UserAvatar: () => null }));

import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { UserSelector } from "./UserSelector";

beforeAll(() => {
  ModuleRegistry.register("User" as any, { name: "users" } as any);
});

let formRef: any;
function Host() {
  const form = useForm<{ user?: { id: string } }>();
  useEffect(() => {
    formRef = form;
  });
  return <UserSelector id="user" form={form} placeholder="pick" />;
}

async function openList() {
  render(<Host />);
  await userEvent.click(screen.getByText("pick"));
  return screen.findByRole("listbox");
}

describe("UserSelector", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    searchSpy.mockReset();
  });

  it("highlights only one of two same-named users and selects the one clicked", async () => {
    const list = await openList();
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    const highlighted = within(list)
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(highlighted).toHaveLength(1);

    const sameNamed = within(list).getAllByRole("option", { name: "Mario Rossi" });
    expect(sameNamed).toHaveLength(2);
    await userEvent.click(sameNamed[1]);
    expect(formRef.getValues("user")).toEqual({ id: "u2", name: "Mario Rossi", avatar: "a2" });
  });

  it("still filters the list when the user types", async () => {
    const list = await openList();
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    await userEvent.type(screen.getByRole("textbox"), "anna");

    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith("anna"));
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1));
    expect(within(list).getByRole("option", { name: "Anna Bianchi" })).toBeInTheDocument();
  });
});
