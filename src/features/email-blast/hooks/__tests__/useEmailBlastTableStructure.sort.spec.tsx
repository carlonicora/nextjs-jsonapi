import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailBlastFields } from "../../data/email-blast.fields";
import { useEmailBlastTableStructure } from "../useEmailBlastTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A17: every column, the counts mapped to their stored property. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useEmailBlastTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useEmailBlastTableStructure({ data: [], fields: Object.values(EmailBlastFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["failed", "purpose", "sent", "sentAt", "status", "subject", "unsubscribed"]);
  });

  it("maps the columns whose key differs from the stored property (call C4)", () => {
    const { result } = renderHook(() =>
      useEmailBlastTableStructure({ data: [], fields: Object.values(EmailBlastFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortFields = Object.fromEntries(
      columns.filter((column) => column.meta?.sortFields).map((column) => [column.id, column.meta.sortFields]),
    );
    expect(sortFields).toEqual({ sent: ["sentCount"], failed: ["failedCount"], unsubscribed: ["unsubscribedCount"] });
  });
});
