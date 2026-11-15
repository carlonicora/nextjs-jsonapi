import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvoiceStatus, StripeInvoiceInterface } from "../../../data/stripe-invoice.interface";
import { InvoiceDetails } from "../InvoiceDetails";

vi.mock("../../../../components/utils/useBillingFormatOptions", () => ({
  useBillingFormatOptions: () => ({ locale: "en", dateLocale: "en", t: (key: string) => key }),
}));

const invoice = {
  id: "inv-1",
  stripeInvoiceId: "in_12345678",
  stripeInvoiceNumber: "INV-1",
  status: InvoiceStatus.OPEN,
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
} as unknown as StripeInvoiceInterface;

function renderDetails(readOnly?: boolean) {
  render(
    <InvoiceDetails invoice={invoice} open onOpenChange={vi.fn()} onInvoiceChange={vi.fn()} readOnly={readOnly} />,
  );
}

describe("InvoiceDetails", () => {
  it("shows retry and view in Stripe for an attempted open invoice", () => {
    renderDetails();
    expect(screen.getByTestId("invoice-details-download")).toBeInTheDocument();
    expect(screen.getByTestId("invoice-details-retry")).toBeInTheDocument();
    expect(screen.getByTestId("invoice-details-view-in-stripe")).toBeInTheDocument();
  });

  it("readOnly keeps only Download PDF", () => {
    renderDetails(true);
    expect(screen.getByTestId("invoice-details-download")).toBeInTheDocument();
    expect(screen.queryByTestId("invoice-details-retry")).not.toBeInTheDocument();
    expect(screen.queryByTestId("invoice-details-view-in-stripe")).not.toBeInTheDocument();
  });
});
