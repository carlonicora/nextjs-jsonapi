import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeInvoiceInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeSubscriptionInterface } from "../../../stripe-subscription/data/stripe-subscription.interface";
import { AdminCompanyPaymentsTab } from "../AdminCompanyPaymentsTab";
import { AdminCompanySubscriptionTab } from "../AdminCompanySubscriptionTab";

const mocks = vi.hoisted(() => ({
  findSubscriptions: vi.fn(),
  findInvoices: vi.fn(),
}));

vi.mock("next-intl", () => {
  const t = (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${Object.values(values).map(String).join(" ")}` : key;
  (t as any).has = () => true;
  return {
    useTranslations: () => t,
    useLocale: () => "en",
    useNow: () => new Date(),
    useTimeZone: () => "UTC",
    useFormatter: () => ({ dateTime: vi.fn(), number: vi.fn(), relativeTime: vi.fn() }),
  };
});

vi.mock("../../../../../core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../core")>()),
  Modules: new Proxy({}, { get: (_target, name) => ({ name: String(name).toLowerCase() }) }),
}));

vi.mock("../../../stripe-subscription/data/stripe-subscription.service", () => ({
  StripeSubscriptionService: { findManyForCompany: mocks.findSubscriptions },
}));

vi.mock("../../../stripe-invoice/data/stripe-invoice.service", () => ({
  StripeInvoiceService: { findManyForCompany: mocks.findInvoices },
}));

vi.mock("../../../../company/contexts/CompanyContext", () => ({
  useCompanyContext: () => ({ company: { id: "company-1" }, setCompany: () => {} }),
}));

vi.mock("../../../components/utils/useBillingFormatOptions", () => ({
  useBillingFormatOptions: () => ({ locale: "en", dateLocale: "en", t: (key: string) => key }),
}));

const proYearly = {
  id: "price-1",
  nickname: "Pro yearly",
  priceType: "recurring",
  recurring: { interval: "year", intervalCount: 1 },
  currency: "eur",
  unitAmount: 5900,
} as unknown as StripePriceInterface;

const subscription = {
  id: "sub-1",
  status: "active",
  cancelAtPeriodEnd: false,
  canceledAt: undefined,
  trialEnd: undefined,
  currentPeriodStart: new Date("2026-10-14T00:00:00Z"),
  currentPeriodEnd: new Date("2027-10-14T00:00:00Z"),
  createdAt: new Date("2026-06-14T00:00:00Z"),
  price: proYearly,
} as unknown as StripeSubscriptionInterface;

const invoice = {
  id: "inv-1",
  stripeInvoiceId: "in_1",
  stripeInvoiceNumber: "INV-1",
  status: "paid",
  attempted: true,
  attemptCount: 1,
  amountDue: 5900,
  amountPaid: 5900,
  amountRemaining: 0,
  subtotal: 5900,
  total: 5900,
  currency: "eur",
  paidAt: new Date("2026-10-14T00:00:00Z"),
  periodStart: new Date("2026-10-14T00:00:00Z"),
  periodEnd: new Date("2027-10-14T00:00:00Z"),
  stripePdfUrl: "https://example.test/invoice.pdf",
  stripePrice: proYearly,
  forSubscription: true,
} as unknown as StripeInvoiceInterface;

const oldPurchase = {
  id: "pi-1",
  status: "active",
  currentPeriodStart: new Date("2026-05-01T00:00:00Z"),
  price: { id: "price-2", priceType: "one_time", currency: "eur", unitAmount: 500 },
} as unknown as StripeSubscriptionInterface;

beforeEach(() => {
  mocks.findSubscriptions.mockReset();
  mocks.findInvoices.mockReset();
});

describe("AdminCompanySubscriptionTab", () => {
  it("shows the plan by its price name", async () => {
    mocks.findSubscriptions.mockResolvedValue([subscription]);
    render(<AdminCompanySubscriptionTab />);
    expect((await screen.findByTestId("admin-company-subscription-plan")).textContent).toBe("Pro yearly");
    expect(mocks.findSubscriptions).toHaveBeenCalledWith({ companyId: "company-1" });
  });

  it("shows No subscription when there is none", async () => {
    mocks.findSubscriptions.mockResolvedValue([]);
    render(<AdminCompanySubscriptionTab />);
    expect(await screen.findByTestId("admin-company-subscription-none")).toBeInTheDocument();
  });

  it("shows a loading placeholder, then the one-line error when the request fails", async () => {
    let reject: (error: Error) => void = () => {};
    mocks.findSubscriptions.mockReturnValue(new Promise((_resolve, r) => (reject = r)));
    render(<AdminCompanySubscriptionTab />);
    expect(screen.getByTestId("admin-company-subscription")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-company-subscription-plan")).toBeNull();
    reject(new Error("boom"));
    expect(await screen.findByTestId("admin-company-subscription-error")).toBeInTheDocument();
  });
});

describe("AdminCompanyPaymentsTab", () => {
  it("lists payments by price name with the total, and an invoice date opens the read-only dialog", async () => {
    mocks.findInvoices.mockResolvedValue([invoice]);
    mocks.findSubscriptions.mockResolvedValue([oldPurchase]);
    render(<AdminCompanyPaymentsTab />);

    await waitFor(() => expect(screen.getAllByTestId("admin-company-payment-for")).toHaveLength(2));
    expect(screen.getAllByTestId("admin-company-payment-for").map((el) => el.textContent)).toEqual([
      "Pro yearly",
      "billing.ui.admin_company.for.one_time",
    ]);
    expect(screen.getByTestId("admin-company-payments-total").textContent).toContain("64.00");
    expect(mocks.findSubscriptions).toHaveBeenCalledWith({ companyId: "company-1", oneTime: true });

    const dates = screen.getAllByTestId("admin-company-payment-date");
    expect(dates[0]).toHaveAttribute("data-clickable", "true");
    expect(dates[1]).toHaveAttribute("data-clickable", "false");
    fireEvent.click(dates[0]);
    expect(await screen.findByTestId("invoice-details-download")).toBeInTheDocument();
    expect(screen.queryByTestId("invoice-details-retry")).toBeNull();
  });

  it("shows No payments yet and no total for an empty list", async () => {
    mocks.findInvoices.mockResolvedValue([]);
    mocks.findSubscriptions.mockResolvedValue([]);
    render(<AdminCompanyPaymentsTab />);
    expect(await screen.findByTestId("admin-company-payments-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-company-payments-total")).toBeNull();
  });

  it("shows the one-line error when one of its two requests fails", async () => {
    mocks.findInvoices.mockResolvedValue([invoice]);
    mocks.findSubscriptions.mockRejectedValue(new Error("boom"));
    render(<AdminCompanyPaymentsTab />);
    expect(await screen.findByTestId("admin-company-payments-error")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-company-payments-total")).toBeNull();
  });
});
