import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StripePriceFields } from "../../data/stripe-price.fields";
import { useStripePriceTableStructure } from "../useStripePriceTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A22: nickname, amount, interval, token, status. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useStripePriceTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useStripePriceTableStructure({ data: [], fields: Object.values(StripePriceFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["amount", "interval", "nickname", "status", "token"]);
  });

  it("maps the columns whose key differs from the stored property (call C4)", () => {
    const { result } = renderHook(() =>
      useStripePriceTableStructure({ data: [], fields: Object.values(StripePriceFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortFields = Object.fromEntries(
      columns.filter((column) => column.meta?.sortFields).map((column) => [column.id, column.meta.sortFields]),
    );
    expect(sortFields).toEqual({ amount: ["unitAmount"], interval: ["recurringInterval"], status: ["active"] });
  });
});
