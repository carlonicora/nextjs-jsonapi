import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotificationFields } from "../../data/notification.fields";
import { useNotificationTableStructure } from "../useNotificationTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));
vi.mock("../../contexts/NotificationContext", () => ({ useNotificationContext: () => ({}) }));

/** Spec row A6: createdAt. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useNotificationTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useNotificationTableStructure({ data: [], fields: Object.values(NotificationFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["createdAt"]);
  });
});
