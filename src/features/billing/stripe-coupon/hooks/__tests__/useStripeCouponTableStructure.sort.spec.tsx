import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StripeCouponFields } from "../../data/stripe-coupon.fields";
import { useStripeCouponTableStructure } from "../useStripeCouponTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A20: name, status (valid), places, discount; codes (a count) is not sortable. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useStripeCouponTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useStripeCouponTableStructure({ data: [], fields: Object.values(StripeCouponFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["discount", "name", "places", "status"]);
  });

  it("maps the columns whose key differs from the stored property (call C4)", () => {
    const { result } = renderHook(() =>
      useStripeCouponTableStructure({ data: [], fields: Object.values(StripeCouponFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortFields = Object.fromEntries(
      columns.filter((column) => column.meta?.sortFields).map((column) => [column.id, column.meta.sortFields]),
    );
    expect(sortFields).toEqual({
      discount: ["discountType", "percentOff", "amountOff"],
      places: ["timesRedeemed", "maxRedemptions"],
      status: ["valid"],
    });
  });
});
