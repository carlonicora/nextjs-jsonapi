import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailAutomationEnrollmentFields } from "../../data/email-automation-enrollment.fields";
import { useEmailAutomationEnrollmentTableStructure } from "../useEmailAutomationEnrollmentTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));

/** Spec row A4: email, name, status, nextSendAt; the computed step and sent count are not sortable. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useEmailAutomationEnrollmentTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useEmailAutomationEnrollmentTableStructure({
        data: [],
        fields: Object.values(EmailAutomationEnrollmentFields) as any,
      }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["email", "name", "nextSendAt", "status"]);
  });
});
