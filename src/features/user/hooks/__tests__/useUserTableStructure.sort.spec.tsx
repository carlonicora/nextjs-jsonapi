import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserFields } from "../../data";
import { useUserTableStructure } from "../useUserTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec rows A8, A9, A11, A12, A13, A15, A16: name, email. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useUserTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() => useUserTableStructure({ data: [], fields: Object.values(UserFields) as any }));
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["email", "name"]);
  });
});
