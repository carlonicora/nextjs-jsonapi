import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailAutomationFields } from "../../data/email-automation.fields";
import { useEmailAutomationTableStructure } from "../useEmailAutomationTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A5: name, purpose, trigger, status (isActive); the counts stay unsortable. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useEmailAutomationTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useEmailAutomationTableStructure({ data: [], fields: Object.values(EmailAutomationFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["name", "purpose", "status", "trigger"]);
  });

  it("maps the columns whose key differs from the stored property (call C4)", () => {
    const { result } = renderHook(() =>
      useEmailAutomationTableStructure({ data: [], fields: Object.values(EmailAutomationFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortFields = Object.fromEntries(
      columns.filter((column) => column.meta?.sortFields).map((column) => [column.id, column.meta.sortFields]),
    );
    expect(sortFields).toEqual({ status: ["isActive"] });
  });
});
