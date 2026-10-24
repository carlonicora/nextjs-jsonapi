import { PaymentMethodInterface } from "../../../stripe-customer/data/payment-method.interface";

export type ReviewCard = { brand: string; last4: string };

/**
 * The card the review shows as the one on file: the customer's default, or the
 * first card listed when no default is set (or the default is no longer listed).
 * Null when no card with a brand and last 4 digits is known.
 */
export function reviewCard(
  methods: PaymentMethodInterface[] | null | undefined,
  defaultPaymentMethodId: string | null | undefined,
): ReviewCard | null {
  if (!methods || methods.length === 0) return null;

  const method = (defaultPaymentMethodId && methods.find((m) => m.id === defaultPaymentMethodId)) || methods[0];
  if (!method.card?.last4) return null;

  const brand = method.card.brand
    ? method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)
    : method.type.charAt(0).toUpperCase() + method.type.slice(1);

  return { brand, last4: method.card.last4 };
}
