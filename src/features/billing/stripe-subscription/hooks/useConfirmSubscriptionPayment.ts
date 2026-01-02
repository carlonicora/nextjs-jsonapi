"use client";

import { useStripe } from "@stripe/react-stripe-js";
import { useCallback, useState } from "react";

export interface ConfirmPaymentResult {
  success: boolean;
  error?: string;
}

export interface UseConfirmSubscriptionPaymentReturn {
  confirmPayment: (clientSecret: string) => Promise<ConfirmPaymentResult>;
  isConfirming: boolean;
}

/**
 * Hook for confirming subscription payments using Stripe's SCA-compliant flow.
 *
 * This hook wraps stripe.confirmCardPayment() and handles:
 * - Loading state during confirmation
 * - Error handling for Stripe errors
 * - 3D Secure authentication popups (handled automatically by Stripe)
 *
 * @example
 * ```tsx
 * const { confirmPayment, isConfirming } = useConfirmSubscriptionPayment();
 *
 * const handleCreateSubscription = async () => {
 *   const result = await StripeSubscriptionService.createSubscription({ priceId });
 *
 *   if (result.meta.requiresAction && result.meta.clientSecret) {
 *     const confirmation = await confirmPayment(result.meta.clientSecret);
 *     if (!confirmation.success) {
 *       setError(confirmation.error);
 *       return;
 *     }
 *   }
 *
 *   // Subscription is now active
 * };
 * ```
 */
export function useConfirmSubscriptionPayment(): UseConfirmSubscriptionPaymentReturn {
  const stripe = useStripe();
  const [isConfirming, setIsConfirming] = useState(false);

  const confirmPayment = useCallback(
    async (clientSecret: string): Promise<ConfirmPaymentResult> => {
      if (!stripe) {
        console.error("[useConfirmSubscriptionPayment] Stripe not initialized");
        return {
          success: false,
          error: "Payment system not initialized. Please refresh the page and try again.",
        };
      }

      if (!clientSecret) {
        console.error("[useConfirmSubscriptionPayment] No client secret provided");
        return {
          success: false,
          error: "Payment confirmation failed. Missing payment details.",
        };
      }

      setIsConfirming(true);

      try {
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

        if (stripeError) {
          console.error("[useConfirmSubscriptionPayment] Stripe error:", stripeError);
          return {
            success: false,
            error: stripeError.message || "Payment confirmation failed. Please try again.",
          };
        }

        if (paymentIntent?.status === "succeeded") {
          return { success: true };
        }

        if (paymentIntent?.status === "requires_action") {
          // This shouldn't happen as Stripe handles 3DS inline, but handle it just in case
          return {
            success: false,
            error: "Additional authentication required. Please complete the verification.",
          };
        }

        return {
          success: false,
          error: "Payment could not be completed. Please try again.",
        };
      } catch (err: any) {
        console.error("[useConfirmSubscriptionPayment] Unexpected error:", err);
        return {
          success: false,
          error: err.message || "An unexpected error occurred during payment confirmation.",
        };
      } finally {
        setIsConfirming(false);
      }
    },
    [stripe],
  );

  return {
    confirmPayment,
    isConfirming,
  };
}
