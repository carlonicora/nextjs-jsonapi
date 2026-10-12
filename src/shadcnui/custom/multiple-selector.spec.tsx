import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MultipleSelector, type MultipleSelectorProps, type Option } from "./multiple-selector";

// Two options with the SAME label: when the row value was the label, both rows shared
// one cmdk value and highlighted/selected together.
const options: Option[] = [
  { label: "Mario Rossi", value: "u1" },
  { label: "Mario Rossi", value: "u2" },
  { label: "Anna Bianchi", value: "u3" },
];

async function openList(props: Partial<MultipleSelectorProps> = {}) {
  render(<MultipleSelector defaultOptions={options} placeholder="pick" {...props} />);
  await userEvent.click(screen.getByPlaceholderText("pick"));
  return screen.findByRole("listbox");
}

const highlightedRows = (list: HTMLElement) =>
  within(list)
    .getAllByRole("option")
    .filter((o) => o.getAttribute("aria-selected") === "true");

const optionNames = (list: HTMLElement) =>
  within(list)
    .getAllByRole("option")
    .map((o) => o.textContent);

describe("MultipleSelector", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("highlights only one of two same-labelled options and selects the one clicked", async () => {
    const onChange = vi.fn();
    const list = await openList({ onChange });

    const highlighted = highlightedRows(list);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]).toHaveTextContent("Mario Rossi");

    await userEvent.keyboard("{ArrowDown}");
    expect(highlightedRows(list)).toHaveLength(1);

    const sameLabelled = within(list).getAllByRole("option", { name: "Mario Rossi" });
    expect(sameLabelled).toHaveLength(2);
    await userEvent.click(sameLabelled[1]);
    expect(onChange).toHaveBeenLastCalledWith([options[1]]);
  });

  it("still filters by the option label when the user types", async () => {
    const list = await openList();
    await userEvent.type(screen.getByPlaceholderText("pick"), "anna");

    await waitFor(() => expect(within(list).queryAllByRole("option", { name: "Mario Rossi" })).toHaveLength(0));
    expect(within(list).getByRole("option", { name: "Anna Bianchi" })).toBeInTheDocument();
  });

  it("does not match an option by its raw value, only by its label (as before)", async () => {
    const list = await openList();
    await userEvent.type(screen.getByPlaceholderText("pick"), "u3");

    await waitFor(() => expect(within(list).queryByRole("option", { name: "Anna Bianchi" })).toBeNull());
  });

  it("ranks matches by label score as before", async () => {
    const list = await openList({
      defaultOptions: [
        { label: "Cabana", value: "o1" },
        { label: "Ananas", value: "o2" },
      ],
    });
    expect(optionNames(list)).toEqual(["Cabana", "Ananas"]);

    await userEvent.type(screen.getByPlaceholderText("pick"), "ana");
    await waitFor(() => expect(optionNames(list)).toEqual(["Ananas", "Cabana"]));
  });

  it("keeps the create row findable and creates the typed text", async () => {
    const onChange = vi.fn();
    const list = await openList({ onChange, creatable: true });
    await userEvent.type(screen.getByPlaceholderText("pick"), "Zed");

    const createRow = await within(list).findByRole("option", { name: 'Create "Zed"' });
    expect(within(list).queryAllByRole("option", { name: "Mario Rossi" })).toHaveLength(0);
    await userEvent.click(createRow);
    expect(onChange).toHaveBeenLastCalledWith([{ value: "Zed", label: "Zed" }]);
  });

  it("filters by substring of the label when creatable, as before", async () => {
    const list = await openList({ creatable: true });
    await userEvent.type(screen.getByPlaceholderText("pick"), "bianchi");

    await waitFor(() => expect(within(list).queryAllByRole("option", { name: "Mario Rossi" })).toHaveLength(0));
    expect(within(list).getByRole("option", { name: "Anna Bianchi" })).toBeInTheDocument();
  });

  it("hands a caller-supplied filter the row text, never the raw option value", async () => {
    const filter = vi.fn((value: string, search: string) => (value.toLowerCase().includes(search) ? 1 : 0));
    const list = await openList({ commandProps: { filter } });
    await userEvent.type(screen.getByPlaceholderText("pick"), "anna");

    await waitFor(() => expect(within(list).queryAllByRole("option", { name: "Mario Rossi" })).toHaveLength(0));
    const seenValues = filter.mock.calls.map((c) => c[0]);
    expect(seenValues).toContain("Anna Bianchi");
    expect(seenValues).not.toContain("u1");
    expect(seenValues).not.toContain("u3");
  });
});
