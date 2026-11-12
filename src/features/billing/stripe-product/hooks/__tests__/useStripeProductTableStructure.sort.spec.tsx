import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StripeProductFields } from "../../data/stripe-product.fields";
import { useStripeProductTableStructure } from "../useStripeProductTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A23: name, status (active); prices (a count) is not sortable. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useStripeProductTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useStripeProductTableStructure({ data: [], fields: Object.values(StripeProductFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["name", "status"]);
  });

  it("maps the columns whose key differs from the stored property (call C4)", () => {
    const { result } = renderHook(() =>
      useStripeProductTableStructure({ data: [], fields: Object.values(StripeProductFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortFields = Object.fromEntries(
      columns.filter((column) => column.meta?.sortFields).map((column) => [column.id, column.meta.sortFields]),
    );
    expect(sortFields).toEqual({ status: ["active"] });
  });
});
