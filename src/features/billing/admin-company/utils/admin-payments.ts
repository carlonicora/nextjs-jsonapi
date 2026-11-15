import { StripeInvoiceInterface } from "../../stripe-invoice/data/stripe-invoice.interface";
import { StripeSubscriptionInterface } from "../../stripe-subscription/data/stripe-subscription.interface";
import { adminPlanFromPrice, adminPriceName, safeDate } from "./admin-subscription-state";

/** One row of the administrator's Payments list: an invoice, or an old purchase with no invoice. */
export type AdminPaymentRow = {
  id: string;
  date: Date;
  forKey: "monthly" | "yearly" | "other" | "one_time" | "unknown";
  forName?: string;
  /** The name of the price the row was for (nickname, else product name), when known. */
  priceName?: string;
  status: "paid" | "open" | "void" | "uncollectible" | "failed" | "draft";
  amount?: number;
  currency?: string;
  periodStart?: Date;
  periodEnd?: Date;
  /** Set on invoice rows only; old purchase rows are not clickable. */
  invoice?: StripeInvoiceInterface;
};

/** An open or uncollectible invoice Stripe already tried to charge. */
export function isFailedInvoice(invoice: StripeInvoiceInterface): boolean {
  const status = invoice.status as string;
  return (status === "open" || status === "uncollectible") && (invoice.attemptCount ?? 0) > 0;
}

function invoiceRow(invoice: StripeInvoiceInterface): AdminPaymentRow {
  const status = invoice.status as string;
  const plan = invoice.stripePrice ? adminPlanFromPrice(invoice.stripePrice) : undefined;
  // No recorded price: without a subscription it can only be a one-time purchase; with one, the
  // plan is not known (never guessed from the subscription's current plan).
  const forKey: AdminPaymentRow["forKey"] = plan
    ? plan.key
    : invoice.forSubscription === false
      ? "one_time"
      : "unknown";

  const row: AdminPaymentRow = {
    id: invoice.id,
    date: invoice.paidAt ?? safeDate(() => invoice.periodStart) ?? invoice.createdAt,
    forKey,
    status: isFailedInvoice(invoice) ? "failed" : (status as AdminPaymentRow["status"]),
    amount: status === "paid" ? invoice.amountPaid : invoice.amountDue,
    currency: invoice.currency,
    invoice,
  };
  if (plan?.key === "other") row.forName = plan.name;
  row.priceName = adminPriceName(invoice.stripePrice);
  if (forKey !== "one_time") {
    row.periodStart = invoice.servicePeriodStart;
    row.periodEnd = invoice.servicePeriodEnd;
  }
  return row;
}

function purchaseRow(purchase: StripeSubscriptionInterface): AdminPaymentRow {
  const price = purchase.price;
  const amount = price?.unitAmount !== undefined ? price.unitAmount * (purchase.quantity ?? 1) : undefined;
  return {
    id: purchase.id,
    date: safeDate(() => purchase.currentPeriodStart) ?? purchase.createdAt,
    forKey: "one_time",
    priceName: adminPriceName(price),
    status: "paid",
    amount,
    currency: price?.currency,
  };
}

/** Invoices (drafts left out) and old one-time purchases, merged newest first. */
export function buildAdminPayments(
  invoices: StripeInvoiceInterface[],
  purchases: StripeSubscriptionInterface[],
): AdminPaymentRow[] {
  return [
    ...invoices.filter((invoice) => (invoice.status as string) !== "draft").map(invoiceRow),
    ...purchases.map(purchaseRow),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** What was paid, one total per currency: eur first, then alphabetical. */
export function totalsByCurrency(rows: AdminPaymentRow[]): { currency: string; amount: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.status !== "paid" || row.amount === undefined || !row.currency) continue;
    const currency = row.currency.toLowerCase();
    totals.set(currency, (totals.get(currency) ?? 0) + row.amount);
  }
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => {
      if (a.currency === b.currency) return 0;
      if (a.currency === "eur") return -1;
      if (b.currency === "eur") return 1;
      return a.currency.localeCompare(b.currency);
    });
}
