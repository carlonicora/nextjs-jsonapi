import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoleFields } from "../../data";
import { useRoleTableStructure } from "../useRoleTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec rows A25, A26: name, description. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useRoleTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() => useRoleTableStructure({ data: [], fields: Object.values(RoleFields) as any }));
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["description", "name"]);
  });
});
