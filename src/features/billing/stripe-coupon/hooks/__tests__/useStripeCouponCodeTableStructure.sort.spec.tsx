import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StripeCouponCodeFields } from "../../data/stripe-coupon-code.fields";
import { useStripeCouponCodeTableStructure } from "../useStripeCouponCodeTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));
vi.mock("../../../contexts/CouponContext", () => ({ useCouponContext: () => ({}) }));

/** Spec row A21: code, expiresAt, automatic, places (timesRedeemed); status is derived. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useStripeCouponCodeTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useStripeCouponCodeTableStructure({ data: [], fields: Object.values(StripeCouponCodeFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["automatic", "code", "expiresAt", "places"]);
  });

  it("maps the columns whose key differs from the stored property (call C4)", () => {
    const { result } = renderHook(() =>
      useStripeCouponCodeTableStructure({ data: [], fields: Object.values(StripeCouponCodeFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortFields = Object.fromEntries(
      columns.filter((column) => column.meta?.sortFields).map((column) => [column.id, column.meta.sortFields]),
    );
    expect(sortFields).toEqual({ places: ["timesRedeemed"] });
  });
});
