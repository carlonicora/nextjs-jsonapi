import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// Loads the core barrel first, as the app does: the hook reaches it through the components barrel,
// which on its own resolves a model module before its base class (circular import).
import "../../../../core";
import { ContentFields } from "../../data";
import { useContentTableStructure } from "../useContentTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec rows A7, A10: name. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useContentTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useContentTableStructure({ data: [], fields: Object.values(ContentFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["name"]);
  });
});
