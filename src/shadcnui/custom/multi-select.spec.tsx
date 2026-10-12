import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MultiSelect } from "./multi-select";

// Two options with the SAME label: cmdk derives an item's value from its text when no
// `value` is given, so without a unique value both rows highlight together.
const options = [
  { label: "Mario Rossi", value: "u1" },
  { label: "Mario Rossi", value: "u2" },
  { label: "Anna Bianchi", value: "u3" },
];

async function openList(onValueChange = vi.fn()) {
  render(<MultiSelect options={options} onValueChange={onValueChange} placeholder="pick" />);
  await userEvent.click(screen.getByText("pick"));
  return screen.findByRole("listbox");
}

const highlightedRows = (list: HTMLElement) =>
  within(list)
    .getAllByRole("option")
    .filter((o) => o.getAttribute("aria-selected") === "true");

describe("MultiSelect", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("highlights only one of two same-labelled options and toggles the one clicked", async () => {
    const onValueChange = vi.fn();
    const list = await openList(onValueChange);

    // "(Select All)" starts highlighted; one step down lands on the first "Mario Rossi".
    await userEvent.keyboard("{ArrowDown}");
    const highlighted = highlightedRows(list);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]).toHaveTextContent("Mario Rossi");

    const sameLabelled = within(list).getAllByRole("option", { name: "Mario Rossi" });
    expect(sameLabelled).toHaveLength(2);
    await userEvent.click(sameLabelled[1]);
    expect(onValueChange).toHaveBeenLastCalledWith(["u2"]);
  });

  it("still filters by the option label when the user types", async () => {
    const list = await openList();
    await userEvent.type(screen.getByPlaceholderText("Search..."), "anna");

    await waitFor(() => expect(within(list).queryAllByRole("option", { name: "Mario Rossi" })).toHaveLength(0));
    expect(within(list).getByRole("option", { name: "Anna Bianchi" })).toBeInTheDocument();
    expect(within(list).queryByRole("option", { name: "(Select All)" })).toBeNull();
  });

  it("does not match an option by its raw value, only by its label (as before)", async () => {
    const list = await openList();
    await userEvent.type(screen.getByPlaceholderText("Search..."), "u3");

    await waitFor(() => expect(within(list).queryByRole("option", { name: "Anna Bianchi" })).toBeNull());
  });

  it("keeps the static rows searchable by their text", async () => {
    const list = await openList();
    await userEvent.type(screen.getByPlaceholderText("Search..."), "select all");

    await waitFor(() => expect(within(list).queryAllByRole("option", { name: "Mario Rossi" })).toHaveLength(0));
    expect(within(list).getByRole("option", { name: "(Select All)" })).toBeInTheDocument();
  });
});
