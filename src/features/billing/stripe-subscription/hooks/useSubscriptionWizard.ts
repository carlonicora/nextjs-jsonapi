"use client";

import { useCallback, useMemo, useReducer, useRef } from "react";
import { StripeSubscriptionInterface, StripeSubscriptionService } from "../data";
import { StripePriceInterface } from "../../stripe-price/data/stripe-price.interface";
import { BillingInterval } from "../components/widgets/IntervalToggle";
import { StripeCustomerService } from "../../stripe-customer/data/stripe-customer.service";
import { ProrationPreviewInterface } from "../../stripe-invoice/data/stripe-invoice.interface";

export type WizardStep = "plan-selection" | "review" | "payment-method";

export type WizardState = {
  step: WizardStep;
  selectedPrice: StripePriceInterface | null;
  selectedInterval: BillingInterval;
  hasPaymentMethod: boolean;
  isProcessing: boolean;
  error: string | null;
  prorationPreview: ProrationPreviewInterface | null;
};

type WizardAction =
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SELECT_PRICE"; price: StripePriceInterface }
  | { type: "SET_INTERVAL"; interval: BillingInterval }
  | { type: "SET_HAS_PAYMENT_METHOD"; hasMethod: boolean }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_PRORATION_PREVIEW"; preview: ProrationPreviewInterface | null }
  | { type: "RESET" };

const initialState: WizardState = {
  step: "plan-selection",
  selectedPrice: null,
  selectedInterval: "month",
  hasPaymentMethod: false,
  isProcessing: false,
  error: null,
  prorationPreview: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step, error: null };
    case "SELECT_PRICE":
      return { ...state, selectedPrice: action.price };
    case "SET_INTERVAL":
      return { ...state, selectedInterval: action.interval };
    case "SET_HAS_PAYMENT_METHOD":
      return { ...state, hasPaymentMethod: action.hasMethod };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.isProcessing };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_PRORATION_PREVIEW":
      return { ...state, prorationPreview: action.preview };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export type UseSubscriptionWizardOptions = {
  subscription?: StripeSubscriptionInterface;
  onSuccess: () => void;
  onClose: () => void;
};

export function useSubscriptionWizard({ subscription, onSuccess, onClose }: UseSubscriptionWizardOptions) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialState,
    selectedPrice: subscription?.price || null,
  });

  // Use refs for callbacks to avoid dependency changes
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);
  onSuccessRef.current = onSuccess;
  onCloseRef.current = onClose;

  const checkPaymentMethod = useCallback(async () => {
    try {
      const methods = await StripeCustomerService.listPaymentMethods();
      dispatch({ type: "SET_HAS_PAYMENT_METHOD", hasMethod: methods.length > 0 });
    } catch (error) {
      console.error("[useSubscriptionWizard] Failed to check payment methods:", error);
      dispatch({ type: "SET_HAS_PAYMENT_METHOD", hasMethod: false });
    }
  }, []);

  const selectPrice = useCallback((price: StripePriceInterface) => {
    dispatch({ type: "SELECT_PRICE", price });
  }, []);

  const setInterval = useCallback((interval: BillingInterval) => {
    dispatch({ type: "SET_INTERVAL", interval });
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    dispatch({ type: "SET_STEP", step });
  }, []);

  const goToReview = useCallback(async () => {
    if (!state.selectedPrice) return;

    dispatch({ type: "SET_PROCESSING", isProcessing: true });

    try {
      // Check payment method first
      await checkPaymentMethod();

      // If editing subscription, get proration preview
      if (subscription && state.selectedPrice.id !== subscription.price?.id) {
        const preview = await StripeSubscriptionService.getProrationPreview({
          subscriptionId: subscription.id,
          newPriceId: state.selectedPrice.id,
        });
        dispatch({ type: "SET_PRORATION_PREVIEW", preview });
      }

      dispatch({ type: "SET_STEP", step: "review" });
    } catch (error: any) {
      console.error("[useSubscriptionWizard] Error preparing review:", error);
      dispatch({ type: "SET_ERROR", error: error?.message || "Failed to prepare review" });
    } finally {
      dispatch({ type: "SET_PROCESSING", isProcessing: false });
    }
  }, [state.selectedPrice, subscription, checkPaymentMethod]);

  const confirmSubscription = useCallback(async () => {
    if (!state.selectedPrice) return;

    dispatch({ type: "SET_PROCESSING", isProcessing: true });
    dispatch({ type: "SET_ERROR", error: null });

    try {
      if (subscription) {
        // Change existing subscription
        await StripeSubscriptionService.changePlan({
          id: subscription.id,
          newPriceId: state.selectedPrice.id,
        });
      } else {
        // Create new subscription
        await StripeSubscriptionService.createSubscription({
          id: crypto.randomUUID(),
          priceId: state.selectedPrice.id,
        });
      }

      onSuccessRef.current();
      onCloseRef.current();
    } catch (error: any) {
      console.error("[useSubscriptionWizard] Subscription error:", error);

      // Handle 409 Conflict - duplicate recurring subscription
      if (error?.status === 409 || error?.response?.status === 409) {
        dispatch({
          type: "SET_ERROR",
          error: "You already have an active subscription. Please change your existing plan instead.",
        });
        return;
      }

      // Handle 402 - payment method required
      if (error?.status === 402 || error?.response?.status === 402) {
        dispatch({ type: "SET_HAS_PAYMENT_METHOD", hasMethod: false });
        dispatch({ type: "SET_STEP", step: "payment-method" });
        return;
      }

      dispatch({ type: "SET_ERROR", error: error?.message || "Failed to process subscription" });
    } finally {
      dispatch({ type: "SET_PROCESSING", isProcessing: false });
    }
  }, [state.selectedPrice, subscription]);

  const handlePaymentMethodSuccess = useCallback(async () => {
    dispatch({ type: "SET_HAS_PAYMENT_METHOD", hasMethod: true });
    // Go back to review to confirm subscription
    dispatch({ type: "SET_STEP", step: "review" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const actions = useMemo(
    () => ({
      selectPrice,
      setInterval,
      goToStep,
      goToReview,
      confirmSubscription,
      handlePaymentMethodSuccess,
      checkPaymentMethod,
      reset,
    }),
    [
      selectPrice,
      setInterval,
      goToStep,
      goToReview,
      confirmSubscription,
      handlePaymentMethodSuccess,
      checkPaymentMethod,
      reset,
    ],
  );

  return {
    state,
    actions,
  };
}
