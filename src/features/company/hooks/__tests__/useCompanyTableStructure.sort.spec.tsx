import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompanyFields } from "../../data";
import { useCompanyTableStructure } from "../useCompanyTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));
vi.mock("../../../user/contexts", () => ({ useCurrentUserContext: () => ({ currentUser: undefined }) }));

/** Spec row A24: name. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useCompanyTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useCompanyTableStructure({ data: [], fields: Object.values(CompanyFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["name"]);
  });
});
