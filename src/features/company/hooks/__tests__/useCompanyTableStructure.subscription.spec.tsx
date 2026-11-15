import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompanyFields } from "../../data";
import { useCompanyTableStructure } from "../useCompanyTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));
vi.mock("../../../user/contexts", () => ({ useCurrentUserContext: () => ({ currentUser: undefined }) }));
vi.mock("../../../billing/admin-company/components/AdminSubscriptionStatusBadge", () => ({
  AdminSubscriptionStatusBadge: ({ state }: { state: string }) => <span data-state={state} />,
}));

const fields = [
  CompanyFields.name,
  CompanyFields.subscriptionPlan,
  CompanyFields.subscriptionStatus,
  CompanyFields.subscriptionNextAt,
];

function renderCell(field: CompanyFields, company: Record<string, unknown>) {
  const { result } = renderHook(() => useCompanyTableStructure({ data: [company as any], fields }));
  const column = (result.current.columns as any[]).find((c) => c.id === field);
  const entry = result.current.data[0];
  const row = { original: entry, getValue: (key: string) => (entry as any)[key] };
  return render(<>{column.cell({ row })}</>);
}

describe("useCompanyTableStructure subscription columns", () => {
  it("adds the three columns, none sortable, with their headers", () => {
    const { result } = renderHook(() => useCompanyTableStructure({ data: [], fields }));
    const columns = result.current.columns as any[];
    const byId = Object.fromEntries(columns.map((c) => [c.id, c]));

    expect(byId.subscriptionPlan.header).toBe("billing.ui.admin_company.columns.plan");
    expect(byId.subscriptionStatus.header).toBe("billing.ui.admin_company.columns.status");
    expect(byId.subscriptionNextAt.header).toBe("billing.ui.admin_company.columns.next_date");
    expect(byId.subscriptionPlan.enableSorting).not.toBe(true);
    expect(byId.subscriptionStatus.enableSorting).not.toBe(true);
    expect(byId.subscriptionNextAt.enableSorting).not.toBe(true);
  });

  it("shows the price name for a monthly plan, never a bare Monthly", () => {
    renderCell(CompanyFields.subscriptionPlan, {
      id: "c1",
      subscriptionPlan: "monthly",
      subscriptionPlanName: "Pro monthly",
    });
    expect(screen.getByTestId("company-subscription-plan").textContent).toBe("Pro monthly");
  });

  it("shows the plan name as is for other", () => {
    renderCell(CompanyFields.subscriptionPlan, { id: "c1", subscriptionPlan: "other", subscriptionPlanName: "Pro" });
    expect(screen.getByTestId("company-subscription-plan").textContent).toBe("Pro");
  });

  it("shows a dash when there is no plan", () => {
    renderCell(CompanyFields.subscriptionPlan, { id: "c1" });
    expect(screen.getByTestId("company-subscription-plan").textContent).toBe("—");
  });

  it("renders the status badge with the state", () => {
    const { container } = renderCell(CompanyFields.subscriptionStatus, { id: "c1", subscriptionStatus: "active" });
    const cell = screen.getByTestId("company-subscription-status");
    expect(cell.querySelector('[data-state="active"]')).not.toBeNull();
    expect(container).toBeTruthy();
  });

  it("shows a dash when there is no status", () => {
    renderCell(CompanyFields.subscriptionStatus, { id: "c1" });
    const cell = screen.getByTestId("company-subscription-status");
    expect(cell.textContent).toBe("—");
    expect(cell.querySelector("[data-state]")).toBeNull();
  });

  it("formats the next date when present", () => {
    renderCell(CompanyFields.subscriptionNextAt, {
      id: "c1",
      subscriptionNextAt: new Date("2027-08-14T00:00:00.000Z"),
    });
    const text = screen.getByTestId("company-subscription-next-date").textContent ?? "";
    expect(text).not.toBe("—");
    expect(text).toContain("2027");
  });

  it("shows a dash when there is no next date", () => {
    renderCell(CompanyFields.subscriptionNextAt, { id: "c1" });
    expect(screen.getByTestId("company-subscription-next-date").textContent).toBe("—");
  });
});
