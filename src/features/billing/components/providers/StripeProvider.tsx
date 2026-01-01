"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { ReactNode, useMemo } from "react";
import { getStripePublishableKey } from "../../../../client/config";

// Cache the stripe promise to avoid recreating on each render
let stripePromiseCache: { key: string; promise: Promise<Stripe | null> } | null = null;

function getStripePromise(publishableKey: string | undefined): Promise<Stripe | null> {
  if (!publishableKey) {
    return Promise.resolve(null);
  }

  // Return cached promise if key matches
  if (stripePromiseCache?.key === publishableKey) {
    return stripePromiseCache.promise;
  }

  // Create and cache new promise
  const promise = loadStripe(publishableKey);
  stripePromiseCache = { key: publishableKey, promise };
  return promise;
}

export function StripeProvider({ children }: { children: ReactNode }) {
  // Evaluate key at render time, not module load time
  const publishableKey = getStripePublishableKey();
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);
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
