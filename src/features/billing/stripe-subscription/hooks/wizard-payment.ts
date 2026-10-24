import { StripeSubscriptionCreateMeta } from "../data/stripe-subscription.interface";

/**
 * The client secret the wizard must confirm in the browser after a subscribe
 * or a trial upgrade, or null when the payment needs nothing more.
 *
 * The API creates a subscription with `payment_behavior: "default_incomplete"`:
 * its first PaymentIntent waits on the browser (`requires_confirmation`, or 3D
 * Secure). Until it is confirmed nothing is paid and the subscription stays
 * `incomplete`, so closing the wizard on the API answer alone is wrong.
 */
export function clientSecretToConfirm(meta: Partial<StripeSubscriptionCreateMeta> | null | undefined): string | null {
  if (!meta?.requiresAction) return null;
  return meta.clientSecret || null;
}

/**
 * The subscription to re-read from Stripe after the browser confirmed its first
 * payment: the one the API just answered with (subscribe), else the one the wizard
 * was opened on (trial upgrade). Null when there is none to sync.
 *
 * Right after the confirmation our copy is still `incomplete` (the webhooks land a
 * second later), so the billing page would show no plan until a reload.
 */
export function subscriptionIdToSync(
  answered: { id?: string } | null | undefined,
  opened: { id?: string } | null | undefined,
): string | null {
  return answered?.id || opened?.id || null;
}
