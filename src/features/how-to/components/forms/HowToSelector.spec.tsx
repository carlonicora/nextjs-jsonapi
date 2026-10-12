import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Two guides with the SAME title: cmdk derives an item's value from its text when no
// `value` is given, so without a unique value both rows highlight together.
const guides = [
  { id: "h1", name: "Come creare una pratica" },
  { id: "h2", name: "Come creare una pratica" },
  { id: "h3", name: "Gestire i contatti" },
];

const { searchSpy } = vi.hoisted(() => ({ searchSpy: vi.fn() }));

vi.mock("../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../hooks")>()),
  // Stands in for the server-side search: `search(term)` narrows the list by title.
  useDataListRetriever: () => {
    const [data, setData] = useState<any[]>(guides);
    const search = useCallback(async (term: string) => {
      searchSpy(term);
      setData(guides.filter((g) => g.name.toLowerCase().includes(term.toLowerCase())));
    }, []);
    return useMemo(() => ({ data, search }), [data, search]);
  },
  useDebounce: (fn: any) => fn,
}));

import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { HowTo } from "../../data/HowTo";
import HowToSelector from "./HowToSelector";

beforeAll(() => {
  ModuleRegistry.register("HowTo" as any, { name: "howtos", model: HowTo } as any);
});

let formRef: any;
function Host() {
  const form = useForm<{ howTo?: { id: string } }>();
  useEffect(() => {
    formRef = form;
  });
  return <HowToSelector id="howTo" form={form} placeholder="pick" />;
}

async function openList() {
  render(<Host />);
  await userEvent.click(screen.getByText("pick"));
  return screen.findByRole("listbox");
}

describe("HowToSelector", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    searchSpy.mockReset();
  });

  it("highlights only one of two same-titled guides and selects the one clicked", async () => {
    const list = await openList();
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    const highlighted = within(list)
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(highlighted).toHaveLength(1);

    const sameTitled = within(list).getAllByRole("option", { name: "Come creare una pratica" });
    expect(sameTitled).toHaveLength(2);
    await userEvent.click(sameTitled[1]);
    expect(formRef.getValues("howTo")).toEqual({ id: "h2", name: "Come creare una pratica" });
  });

  it("still filters the list when the user types", async () => {
    const list = await openList();
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    await userEvent.type(screen.getByRole("textbox"), "contatti");

    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith("contatti"));
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1));
    expect(within(list).getByRole("option", { name: "Gestire i contatti" })).toBeInTheDocument();
  });
});
