import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// Loads the core barrel first, as the app does: the hook reaches it through the components barrel,
// which on its own resolves a model module before its base class (circular import).
import "../../../../core";
import "../../../../components";
import {
  ReferralAdminReferralFields,
  useReferralAdminReferralTableStructure,
} from "../useReferralAdminReferralTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A3 (Referrals): source, status, referredAt, tokensAwarded. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useReferralAdminReferralTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useReferralAdminReferralTableStructure({ data: [], fields: Object.values(ReferralAdminReferralFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["credits", "date", "source", "status"]);
  });

  it("maps the columns whose key differs from the stored property (call C4)", () => {
    const { result } = renderHook(() =>
      useReferralAdminReferralTableStructure({ data: [], fields: Object.values(ReferralAdminReferralFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortFields = Object.fromEntries(
      columns.filter((column) => column.meta?.sortFields).map((column) => [column.id, column.meta.sortFields]),
    );
    expect(sortFields).toEqual({ date: ["referredAt"], credits: ["tokensAwarded"] });
  });
});
