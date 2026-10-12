import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement, useCallback, useMemo, useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { SidebarProvider } from "../../../../shadcnui";
import { HowTo } from "../../data/HowTo";
import HowToCommand from "./HowToCommand";

const guides = [
  {
    id: "a",
    name: "Guida pratiche",
    pages: JSON.stringify(["/proceedings"]),
    contextualKeys: ["proceeding.list"],
    draft: false,
  },
  {
    id: "b",
    name: "Guida contatti",
    pages: JSON.stringify(["/persons"]),
    contextualKeys: ["person.list"],
    draft: false,
  },
];

const { useDataListRetriever, defaultRetriever } = vi.hoisted(() => {
  const defaultRetriever = () => ({ data: guides, search: () => {}, refresh: () => {} });
  return { useDataListRetriever: vi.fn(defaultRetriever), defaultRetriever };
});

vi.mock("../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../hooks")>()),
  useDataListRetriever,
  useDebounce: (fn: any) => fn,
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const { viewerSpy } = vi.hoisted(() => ({ viewerSpy: vi.fn() }));
vi.mock("./HowToCommandViewer", () => ({
  default: ({ howTo }: { howTo: { id: string } }) => {
    viewerSpy(howTo);
    return <div data-testid="howto-viewer" />;
  },
}));

beforeAll(() => {
  ModuleRegistry.register("HowTo" as any, { name: "howtos", model: HowTo } as any);
});

function renderCommand(ui: ReactElement) {
  return render(<SidebarProvider>{ui}</SidebarProvider>);
}

async function open() {
  await userEvent.click(screen.getByRole("button", { name: /howto.command.trigger/ }));
}

describe("HowToCommand relevance", () => {
  it("loads the whole catalogue, not one page, so relevance sees every guide", () => {
    renderCommand(<HowToCommand pathname="/anything" contextKeys={["person.list"]} />);
    expect(useDataListRetriever).toHaveBeenCalledWith(expect.objectContaining({ retrieverParams: { fetchAll: true } }));
  });

  it("uses contextKeys when given", async () => {
    renderCommand(<HowToCommand pathname="/anything" contextKeys={["person.list"]} />);
    await open();
    const relevant = screen.getByText("howto.command.relevant").parentElement!;
    expect(relevant).toHaveTextContent("Guida contatti");
    expect(relevant).not.toHaveTextContent("Guida pratiche");
  });

  it("falls back to pages matching when contextKeys is absent", async () => {
    renderCommand(<HowToCommand pathname="/proceedings" />);
    await open();
    const relevant = screen.getByText("howto.command.relevant").parentElement!;
    expect(relevant).toHaveTextContent("Guida pratiche");
    expect(relevant).not.toHaveTextContent("Guida contatti");
  });
});

// Two guides with the SAME title: cmdk derives an item's value from its text when no
// `value` is given, so without a unique value both rows highlight together.
describe("HowToCommand same-titled guides", () => {
  const sameTitled = [
    { id: "s1", name: "Come creare una pratica", pages: "[]", contextualKeys: [], draft: false },
    { id: "s2", name: "Come creare una pratica", pages: "[]", contextualKeys: [], draft: false },
    { id: "s3", name: "Gestire i contatti", pages: "[]", contextualKeys: [], draft: false },
  ];
  const searchSpy = vi.fn();

  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    useDataListRetriever.mockImplementation(defaultRetriever);
    searchSpy.mockReset();
  });

  function useFakeRetriever() {
    const [data, setData] = useState<any[]>(sameTitled);
    const search = useCallback(async (term: string) => {
      searchSpy(term);
      setData(sameTitled.filter((g) => g.name.toLowerCase().includes(term.toLowerCase())));
    }, []);
    return useMemo(() => ({ data, search, refresh: () => {} }), [data, search]);
  }

  it("highlights only one of two same-titled guides and opens the one clicked", async () => {
    useDataListRetriever.mockImplementation(useFakeRetriever as any);
    renderCommand(<HowToCommand pathname="/anything" />);
    await open();
    const list = await screen.findByRole("listbox");
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    const highlighted = within(list)
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-selected") === "true");
    expect(highlighted).toHaveLength(1);

    const rows = within(list).getAllByRole("option", { name: "Come creare una pratica" });
    expect(rows).toHaveLength(2);
    await userEvent.click(rows[1]);
    // The viewer opens on the clicked guide: the dialog title becomes its name, and
    // HowToCommandViewer receives guide s2.
    expect(await screen.findByRole("heading", { name: "Come creare una pratica" })).toBeInTheDocument();
    expect(viewerSpy).toHaveBeenLastCalledWith(expect.objectContaining({ id: "s2" }));
  });

  it("still filters the list when the user types", async () => {
    useDataListRetriever.mockImplementation(useFakeRetriever as any);
    renderCommand(<HowToCommand pathname="/anything" />);
    await open();
    const list = await screen.findByRole("listbox");
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(3));

    await userEvent.type(screen.getByRole("combobox"), "contatti");

    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith("contatti"));
    await waitFor(() => expect(within(list).getAllByRole("option")).toHaveLength(1));
    expect(within(list).getByRole("option", { name: "Gestire i contatti" })).toBeInTheDocument();
  });
});
