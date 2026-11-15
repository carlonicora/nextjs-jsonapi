import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SharedProvider } from "../../../../contexts";
import { CompanyContent } from "../details/CompanyContent";
import { CompanyDetails } from "../details/CompanyDetails";

const { companyContext } = vi.hoisted(() => ({
  companyContext: vi.fn(),
}));

vi.mock("../../contexts/CompanyContext", () => ({
  useCompanyContext: () => companyContext(),
}));

vi.mock("../../../user/contexts/CurrentUserContext", () => ({
  useCurrentUserContext: () => ({ company: undefined, hasRole: () => false }),
  useCurrentUserContextOptional: () => ({ company: undefined, hasRole: () => false }),
}));

const ACME = { id: "company-1", name: "Acme" } as any;

const SHARED = {
  breadcrumbs: [],
  title: { type: "Company", element: "Acme" },
};

beforeEach(() => {
  vi.clearAllMocks();
  companyContext.mockReturnValue({ company: ACME, setCompany: vi.fn() });
});

describe("CompanyDetails", () => {
  it("does not draw the company title (the page header carries it)", () => {
    render(
      <SharedProvider value={SHARED}>
        <CompanyDetails />
      </SharedProvider>,
    );
    expect(screen.queryAllByRole("heading", { name: "Acme" })).toHaveLength(0);
  });
});

describe("CompanyContent", () => {
  it("renders the actions without a company name heading", () => {
    render(<CompanyContent company={ACME} actions={<button>X</button>} />);
    expect(screen.getByRole("button", { name: "X" })).toBeInTheDocument();
    expect(screen.queryAllByRole("heading", { name: "Acme" })).toHaveLength(0);
  });

  it("renders no company name heading without actions", () => {
    render(<CompanyContent company={ACME} />);
    expect(screen.queryAllByRole("heading", { name: "Acme" })).toHaveLength(0);
  });
});
