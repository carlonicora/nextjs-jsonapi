// Credit warning: shared contract with the backend and pure helpers.
// Keep this file free of any `@stripe/*` import: it is re-exported from the
// Stripe-free `components` entry, because the banner mounts on every page.

import type { CompanyInterface } from "../../company/data/company.interface";
import { SubscriptionStatus } from "../stripe-subscription/data/stripe-subscription.interface";
import type { StripeSubscriptionInterface } from "../stripe-subscription/data/stripe-subscription.interface";

/**
 * The offer the server chose when it sent this period's warning.
 * Mirrors the backend `CreditWarningOffer`.
 */
export type CreditWarningOffer = "subscribe" | "upgrade-or-pack" | "pack";

/**
 * Child segment of the dismiss route: `POST companies/:companyId/credit-warning/dismiss`.
 * Must match the backend `CREDIT_WARNING_DISMISS_SEGMENT`.
 */
export const CREDIT_WARNING_DISMISS_SEGMENT = "credit-warning/dismiss";

/**
 * Whether the in-app credit warning should show for this company.
 *
 * True only when the server sent the warning this period and nobody dismissed it,
 * the company has AI and an active subscription, and the credits left are at or
 * below `100 - thresholdPercent` percent of this period's grant. At 0 credits
 * (or below) it is false: `OutOfCreditsBanner` owns that state.
 */
export function isCreditWarningActive(company: CompanyInterface, thresholdPercent: number): boolean {
  if (!company.aiEnabled || !company.isActiveSubscription) return false;
  if (!company.creditWarningSentAt || company.creditWarningDismissedAt) return false;

  const granted = company.creditsGrantedThisPeriod;
  if (granted === undefined || granted <= 0) return false;

  const monthly = company.availableMonthlyCredits;
  const extra = company.availableExtraCredits;
  // Same "has credits" test as useHasCredits / CompanyService.hasAvailableCredits.
  if (!(monthly > 0 || extra > 0)) return false;

  return monthly + extra <= (granted * (100 - thresholdPercent)) / 100;
}

/**
 * The subscription the `?action=change-plan` deep link opens the wizard on: the
 * first active or trialing recurring subscription, in the dashboard's own order.
 * `undefined` means there is none, and the subscribe wizard opens instead.
 */
export function resolveChangePlanTarget(
  subscriptions: StripeSubscriptionInterface[],
): StripeSubscriptionInterface | undefined {
  return subscriptions.find(
    (sub) =>
      (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIALING) &&
      sub.price?.priceType === "recurring",
  );
}
