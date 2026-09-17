import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

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

const { useDataListRetriever } = vi.hoisted(() => ({
  useDataListRetriever: vi.fn(() => ({ data: guides, search: vi.fn(), refresh: vi.fn() })),
}));

vi.mock("../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../hooks")>()),
  useDataListRetriever,
  useDebounce: (fn: any) => fn,
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

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
