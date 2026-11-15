import { StripePriceInterface } from "../../stripe-price/data/stripe-price.interface";
import { StripeSubscriptionInterface } from "../../stripe-subscription/data/stripe-subscription.interface";

/**
 * The administrator's view of a subscription. The known keys have a
 * `billing.ui.admin_company.status.*` label; any other value is a raw Stripe status, shown as is.
 * The backend computes the same key for the companies list (one shared fixture table).
 */
export type AdminSubscriptionState =
  "trial" | "active" | "cancelled" | "past_due" | "incomplete" | "paused" | "ended" | string;

export const ADMIN_SUBSCRIPTION_STATES: string[] = [
  "trial",
  "active",
  "cancelled",
  "past_due",
  "incomplete",
  "paused",
  "ended",
];

/** Reads a getter that throws when its value is absent (the model's period getters). */
export function safeDate(read: () => Date | undefined): Date | undefined {
  try {
    return read() ?? undefined;
  } catch {
    return undefined;
  }
}

/** The state and the date the administrator sees next to it (renews / ends / ended). */
export function adminSubscriptionState(s: StripeSubscriptionInterface): {
  state: AdminSubscriptionState;
  date?: Date;
} {
  const status = s.status as string;
  const periodEnd = safeDate(() => s.currentPeriodEnd);

  switch (status) {
    case "trialing":
      return { state: s.cancelAtPeriodEnd ? "cancelled" : "trial", date: s.trialEnd ?? undefined };
    case "active":
      return { state: s.cancelAtPeriodEnd ? "cancelled" : "active", date: periodEnd };
    case "past_due":
    case "unpaid":
      return { state: "past_due", date: undefined };
    case "incomplete":
      return { state: "incomplete", date: undefined };
    case "paused":
      return { state: "paused", date: undefined };
    case "canceled":
    case "incomplete_expired": {
      const canceledAt = s.canceledAt ?? undefined;
      const date = canceledAt && (!periodEnd || canceledAt.getTime() > periodEnd.getTime()) ? canceledAt : periodEnd;
      return { state: "ended", date };
    }
    default:
      return { state: status, date: undefined };
  }
}

/** The plan a price stands for: monthly / yearly, anything else by its nickname or product name. */
export type AdminPlan = { key: "monthly" | "yearly" | "other" | "one_time"; name?: string };

export function adminPlanFromPrice(price: StripePriceInterface): AdminPlan {
  if (price.priceType === "one_time" || !price.recurring) return { key: "one_time" };

  const count = price.recurring.intervalCount ?? 1;
  if (count === 1 && price.recurring.interval === "month") return { key: "monthly" };
  if (count === 1 && price.recurring.interval === "year") return { key: "yearly" };
  return { key: "other", name: price.nickname ?? price.product?.name };
}
