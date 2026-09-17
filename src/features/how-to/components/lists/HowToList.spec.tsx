import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { HowTo } from "../../data/HowTo";
import HowToList from "./HowToList";

vi.mock("../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../hooks")>()),
  useDataListRetriever: () => ({ data: [], refresh: vi.fn(), search: vi.fn() }),
}));
vi.mock("../../../../components/tables/ContentListTable", () => ({
  ContentListTable: ({ functions }: { functions: ReactNode[] }) => <div data-testid="functions">{functions}</div>,
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("../forms/HowToEditor", () => ({ default: () => <button>editor</button> }));
vi.mock("../forms/HowToReindexButton", () => ({ default: () => <button>reindex</button> }));

beforeAll(() => {
  ModuleRegistry.register("HowTo" as any, { name: "howtos", model: HowTo } as any);
});

describe("HowToList extraFunctions", () => {
  it("renders extra functions before the reindex button", () => {
    render(<HowToList extraFunctions={[<button key="seed">seed</button>]} />);
    const buttons = screen.getAllByRole("button").map((b) => b.textContent);
    expect(buttons).toEqual(["seed", "reindex", "editor"]);
  });

  it("renders only the built-in functions when extraFunctions is absent", () => {
    render(<HowToList />);
    const buttons = screen.getAllByRole("button").map((b) => b.textContent);
    expect(buttons).toEqual(["reindex", "editor"]);
  });
});
