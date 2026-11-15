import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StripeInvoiceInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeSubscriptionInterface } from "../../../stripe-subscription/data/stripe-subscription.interface";
import { AdminCompanyBilling } from "../AdminCompanyBilling";

const mocks = vi.hoisted(() => ({
  findSubscriptions: vi.fn(),
  findInvoices: vi.fn(),
}));

// Like the global next-intl mock, but it prints the interpolated values, so the amounts and
// discount months reach the DOM.
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

const monthly = {
  id: "price-1",
  priceType: "recurring",
  recurring: { interval: "month", intervalCount: 1 },
  currency: "eur",
  unitAmount: 900,
} as unknown as StripePriceInterface;

function subscription(params: {
  status: string;
  discount?: StripeSubscriptionInterface["discount"];
}): StripeSubscriptionInterface {
  return {
    id: "sub-1",
    status: params.status,
    cancelAtPeriodEnd: false,
    canceledAt: undefined,
    trialEnd: undefined,
    currentPeriodStart: new Date("2026-10-14T00:00:00Z"),
    currentPeriodEnd: new Date("2026-11-14T00:00:00Z"),
    createdAt: new Date("2026-06-14T00:00:00Z"),
    price: monthly,
    discount: params.discount,
  } as unknown as StripeSubscriptionInterface;
}

const invoice = {
  id: "inv-1",
  stripeInvoiceId: "in_12345678",
  stripeInvoiceNumber: "INV-1",
  status: "open",
  attempted: true,
  attemptCount: 1,
  amountDue: 900,
  amountPaid: 0,
  amountRemaining: 900,
  subtotal: 900,
  total: 900,
  currency: "eur",
  periodStart: new Date("2026-06-14T00:00:00Z"),
  periodEnd: new Date("2026-07-14T00:00:00Z"),
  stripePdfUrl: "https://example.test/invoice.pdf",
  stripeHostedInvoiceUrl: "https://example.test/invoice",
  stripePrice: monthly,
  forSubscription: true,
} as unknown as StripeInvoiceInterface;

const oldPurchase = {
  id: "pi-1",
  status: "active",
  currentPeriodStart: new Date("2026-05-01T00:00:00Z"),
  price: {
    id: "price-2",
    priceType: "one_time",
    currency: "eur",
    unitAmount: 500,
  },
} as unknown as StripeSubscriptionInterface;

function mockPayments(invoices: StripeInvoiceInterface[], purchases: StripeSubscriptionInterface[]) {
  mocks.findInvoices.mockResolvedValue(invoices);
  mocks.findSubscriptions.mockImplementation(async (params: { oneTime?: boolean }) =>
    params.oneTime ? purchases : [],
  );
}

beforeEach(() => {
  mocks.findSubscriptions.mockReset();
  mocks.findInvoices.mockReset();
});

describe("AdminCompanyBilling", () => {
  it("loads both lists for the company in context", async () => {
    mockPayments([], []);
    render(<AdminCompanyBilling />);
    await screen.findByTestId("admin-company-payments-empty");
    expect(mocks.findSubscriptions).toHaveBeenCalledWith({ companyId: "company-1" });
    expect(mocks.findSubscriptions).toHaveBeenCalledWith({ companyId: "company-1", oneTime: true });
    expect(mocks.findInvoices).toHaveBeenCalledWith({ companyId: "company-1" });
  });

  it("shows No subscription when the company has none", async () => {
    mockPayments([], []);
    render(<AdminCompanyBilling />);
    expect(await screen.findByTestId("admin-company-subscription-none")).toBeInTheDocument();
  });

  it("shows the subscription error while payments still render", async () => {
    mocks.findInvoices.mockResolvedValue([]);
    mocks.findSubscriptions.mockImplementation(async (params: { oneTime?: boolean }) => {
      if (params.oneTime) return [];
      throw new Error("boom");
    });
    render(<AdminCompanyBilling />);
    expect(await screen.findByTestId("admin-company-subscription-error")).toBeInTheDocument();
    expect(await screen.findByTestId("admin-company-payments-empty")).toBeInTheDocument();
  });

  it("shows the payments error and no total when invoices fail", async () => {
    mocks.findInvoices.mockRejectedValue(new Error("boom"));
    mocks.findSubscriptions.mockImplementation(async (params: { oneTime?: boolean }) =>
      params.oneTime ? [oldPurchase] : [subscription({ status: "active" })],
    );
    render(<AdminCompanyBilling />);
    expect(await screen.findByTestId("admin-company-payments-error")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-company-payments-total")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("admin-company-payment-row")).toHaveLength(0);
    expect(await screen.findByTestId("admin-company-subscription-plan")).toBeInTheDocument();
  });

  it("shows No payments yet and no total for an empty list", async () => {
    mockPayments([], []);
    render(<AdminCompanyBilling />);
    expect(await screen.findByTestId("admin-company-payments-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-company-payments-total")).not.toBeInTheDocument();
  });

  it("an old purchase row is not clickable", async () => {
    mockPayments([], [oldPurchase]);
    render(<AdminCompanyBilling />);
    const row = await screen.findByTestId("admin-company-payment-row");
    expect(row).toHaveAttribute("data-clickable", "false");
    expect(row).toHaveAttribute("data-payment-id", "pi-1");
    fireEvent.click(row);
    expect(screen.queryByTestId("invoice-details-download")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-company-payments-total")).toBeInTheDocument();
  });

  it("an invoice row opens the read-only invoice dialog", async () => {
    mockPayments([invoice], []);
    render(<AdminCompanyBilling />);
    const row = await screen.findByTestId("admin-company-payment-row");
    expect(row).toHaveAttribute("data-clickable", "true");
    expect(within(row).getByTestId("admin-company-payment-status").querySelector("[data-status]")).toHaveAttribute(
      "data-status",
      "failed",
    );
    fireEvent.click(row);
    expect(await screen.findByTestId("invoice-details-download")).toBeInTheDocument();
    expect(screen.queryByTestId("invoice-details-retry")).not.toBeInTheDocument();
    expect(screen.queryByTestId("invoice-details-view-in-stripe")).not.toBeInTheDocument();
  });

  it("shows the discount of a live subscription", async () => {
    mockPayments([], []);
    mocks.findSubscriptions.mockImplementation(async (params: { oneTime?: boolean }) =>
      params.oneTime ? [] : [subscription({ status: "active", discount: { percentOff: 20, duration: "forever" } })],
    );
    render(<AdminCompanyBilling />);
    const discount = await screen.findByTestId("admin-company-subscription-discount");
    expect(discount.textContent).toContain("20%");
    expect(discount.textContent).toContain("billing.ui.admin_company.discount.forever");
  });

  it("shows a zero total when rows exist but none is paid", async () => {
    mockPayments([invoice], []);
    render(<AdminCompanyBilling />);
    const total = await screen.findByTestId("admin-company-payments-total");
    expect(total.textContent).toContain("billing.ui.admin_company.payments.total_paid");
    expect(total.textContent).toContain("0.00");
    expect(total.textContent).not.toContain("9.00");
  });

  it("shows an amount-off discount applied once", async () => {
    mockPayments([], []);
    mocks.findSubscriptions.mockImplementation(async (params: { oneTime?: boolean }) =>
      params.oneTime
        ? []
        : [subscription({ status: "active", discount: { amountOff: 500, currency: "eur", duration: "once" } })],
    );
    render(<AdminCompanyBilling />);
    const discount = await screen.findByTestId("admin-company-subscription-discount");
    expect(discount.textContent).toContain("5.00");
    expect(discount.textContent).toContain("billing.ui.admin_company.discount.once");
  });

  it("shows a repeating discount with its months and end date", async () => {
    mockPayments([], []);
    mocks.findSubscriptions.mockImplementation(async (params: { oneTime?: boolean }) =>
      params.oneTime
        ? []
        : [
            subscription({
              status: "active",
              discount: {
                percentOff: 10,
                duration: "repeating",
                durationInMonths: 3,
                end: new Date("2027-01-14T00:00:00Z"),
              },
            }),
          ],
    );
    render(<AdminCompanyBilling />);
    const discount = await screen.findByTestId("admin-company-subscription-discount");
    expect(discount.textContent).toContain("10%");
    expect(discount.textContent).toContain("billing.ui.admin_company.discount.repeating 3");
    expect(discount.textContent).toContain("billing.ui.admin_company.discount.until");
  });

  it("hides the discount of an ended subscription", async () => {
    mockPayments([], []);
    mocks.findSubscriptions.mockImplementation(async (params: { oneTime?: boolean }) =>
      params.oneTime ? [] : [subscription({ status: "canceled", discount: { percentOff: 20, duration: "forever" } })],
    );
    render(<AdminCompanyBilling />);
    expect(await screen.findByTestId("admin-company-subscription-status")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-company-subscription-discount")).not.toBeInTheDocument();
  });
});
