import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminCompanyContainer } from "../containers/AdminCompanyContainer";

const { companyContext, hasRole } = vi.hoisted(() => ({
  companyContext: vi.fn(),
  hasRole: vi.fn(),
}));

vi.mock("../../../../core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../core")>()),
  Modules: { Company: { name: "companies" } },
}));

vi.mock("../../contexts/CompanyContext", () => ({
  useCompanyContext: () => companyContext(),
}));

vi.mock("../../../user/contexts", () => ({
  useCurrentUserContext: () => ({ hasRole: (roleId: string) => hasRole(roleId) }),
}));

vi.mock("../../../../roles", () => ({
  getRoleId: () => ({ Administrator: "role-administrator" }),
}));

vi.mock("../details/CompanyDetails", () => ({
  CompanyDetails: () => <div data-testid="mock-company-details" />,
}));

vi.mock("../../../user/components", () => ({
  AdminUsersList: () => <div data-testid="mock-admin-users-list" />,
}));

vi.mock("../../../billing/admin-company/components/AdminCompanySubscriptionTab", () => ({
  AdminCompanySubscriptionTab: () => <div data-testid="mock-subscription-tab" />,
}));

vi.mock("../../../billing/admin-company/components/AdminCompanyPaymentsTab", () => ({
  AdminCompanyPaymentsTab: () => <div data-testid="mock-payments-tab" />,
}));

vi.mock("../../../../components/containers/RoundPageContainer", () => ({
  RoundPageContainer: (props: { layout?: string; tabs?: { label: string; content: React.ReactNode }[] }) => (
    <div data-testid="mock-round-page" data-layout={props.layout}>
      {props.tabs?.map((tab) => (
        <section key={tab.label} data-tab={tab.label}>
          {tab.content}
        </section>
      ))}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  companyContext.mockReturnValue({ company: { id: "company-1", name: "Acme" }, setCompany: vi.fn() });
  hasRole.mockImplementation((roleId: string) => roleId === "role-administrator");
});

describe("AdminCompanyContainer", () => {
  it("renders the details and the users list in the caller's container by default", () => {
    const { container } = render(<AdminCompanyContainer />);
    const ids = Array.from(container.querySelectorAll("[data-testid]")).map((el) => el.getAttribute("data-testid"));
    expect(ids).toEqual(["mock-company-details", "mock-admin-users-list"]);
  });

  it("draws the page as vertical tabs Details, Subscription, Payments, Users with showBilling", () => {
    const { container } = render(<AdminCompanyContainer showBilling />);
    expect(screen.getByTestId("mock-round-page")).toHaveAttribute("data-layout", "rail");
    const tabs = Array.from(container.querySelectorAll("[data-tab]")).map((el) => el.getAttribute("data-tab"));
    expect(tabs).toEqual([
      "billing.ui.admin_company.tabs.details",
      "billing.ui.admin_company.subscription.title",
      "billing.ui.admin_company.payments.title",
      "billing.ui.admin_company.tabs.users",
    ]);
    const contents = Array.from(container.querySelectorAll("[data-tab] > [data-testid]")).map((el) =>
      el.getAttribute("data-testid"),
    );
    expect(contents).toEqual([
      "mock-company-details",
      "mock-subscription-tab",
      "mock-payments-tab",
      "mock-admin-users-list",
    ]);
  });

  it("renders nothing for a non-administrator", () => {
    hasRole.mockReturnValue(false);
    const { container } = render(<AdminCompanyContainer showBilling />);
    expect(container.querySelectorAll("[data-testid]")).toHaveLength(0);
  });
});
