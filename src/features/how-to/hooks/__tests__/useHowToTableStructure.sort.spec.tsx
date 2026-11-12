import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HowToFields } from "../../data/HowToFields";
import { useHowToTableStructure } from "../useHowToTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A19: name. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useHowToTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useHowToTableStructure({ data: [], fields: Object.values(HowToFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["name"]);
  });
});
