import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WaitlistFields } from "../../data/waitlist.fields";
import { useWaitlistTableStructure } from "../useWaitlistTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A1: exactly email, status and createdAt are sortable (call C3: an explicit `true`). */
describe("useWaitlistTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useWaitlistTableStructure({ data: [], fields: Object.values(WaitlistFields) as WaitlistFields[] }),
    );
    const sortable = result.current.columns.filter((c) => c.enableSorting === true).map((c) => c.id);
    expect(sortable.sort()).toEqual(["createdAt", "email", "status"]);
  });
});
