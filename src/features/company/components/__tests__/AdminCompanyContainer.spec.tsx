import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminCompanyContainer } from "../containers/AdminCompanyContainer";

const { companyContext, hasRole } = vi.hoisted(() => ({
  companyContext: vi.fn(),
  hasRole: vi.fn(),
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

vi.mock("../../../billing/admin-company/components/AdminCompanyBilling", () => ({
  AdminCompanyBilling: () => <div data-testid="mock-admin-company-billing" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  companyContext.mockReturnValue({ company: { id: "company-1", name: "Acme" }, setCompany: vi.fn() });
  hasRole.mockImplementation((roleId: string) => roleId === "role-administrator");
});

describe("AdminCompanyContainer", () => {
  it("does not render the billing section by default", () => {
    render(<AdminCompanyContainer />);
    expect(screen.getByTestId("mock-company-details")).toBeInTheDocument();
    expect(screen.getByTestId("mock-admin-users-list")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-admin-company-billing")).toBeNull();
  });

  it("renders the billing section between the details and the users list with showBilling", () => {
    const { container } = render(<AdminCompanyContainer showBilling />);
    const ids = Array.from(container.querySelectorAll("[data-testid]")).map((el) => el.getAttribute("data-testid"));
    expect(ids).toEqual(["mock-company-details", "mock-admin-company-billing", "mock-admin-users-list"]);
  });

  it("renders nothing for a non-administrator", () => {
    hasRole.mockReturnValue(false);
    const { container } = render(<AdminCompanyContainer showBilling />);
    expect(container.querySelectorAll("[data-testid]")).toHaveLength(0);
  });
});
