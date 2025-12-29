"use client";

import { getStripePublishableKey } from "../../../../client/config";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { ReactNode, useMemo } from "react";

// Only load Stripe if the publishable key is configured
const getPublishableKey = () => getStripePublishableKey();
const publishableKey = getPublishableKey();
const stripePromise: Promise<Stripe | null> = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);

export function StripeProvider({ children }: { children: ReactNode }) {
  const options = useMemo(() => ({}), []);

  // If no Stripe key is configured, just render children without Stripe context
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

// Helper function to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!getStripePublishableKey();
}
