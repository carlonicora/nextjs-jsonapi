"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useReducer, useRef } from "react";
import { v4 } from "uuid";
import { useI18nLocale } from "../../../../i18n";
import { StripeCustomerService } from "../../stripe-customer/data/stripe-customer.service";
import { ProrationPreviewInterface } from "../../stripe-invoice/data/stripe-invoice.interface";
import { StripePriceInterface } from "../../stripe-price/data/stripe-price.interface";
import { StripeCouponCodeService } from "../../stripe-coupon/data/stripe-coupon-code.service";
import { toPromotionCodeResult } from "../../stripe-coupon/utils/to-promotion-code-result";
import { PromotionCodeValidationResult, StripePromotionCodeService } from "../../stripe-promotion-code";
import { BillingInterval } from "../components/widgets/IntervalToggle";
import {
  StripeSubscriptionCreateResponse,
  StripeSubscriptionInterface,
  StripeSubscriptionService,
  SubscriptionStatus,
} from "../data";
import {
  isDiscountSoldOut,
  isDiscountUnavailable,
  promotionCodeToSend,
  shouldLookUpAutomatic,
} from "./wizard-promotion";
import { useConfirmSubscriptionPayment } from "./useConfirmSubscriptionPayment";
import { clientSecretToConfirm, subscriptionIdToSync } from "./wizard-payment";

export type WizardStep = "plan-selection" | "review" | "payment-method";

export type WizardState = {
  step: WizardStep;
  selectedPrice: StripePriceInterface | null;
  selectedInterval: BillingInterval;
  hasPaymentMethod: boolean;
  isProcessing: boolean;
  error: string | null;
  prorationPreview: ProrationPreviewInterface | null;
  // Promotion code state
  promotionCode: PromotionCodeValidationResult | null;
  isValidatingPromoCode: boolean;
  promoCodeError: string | null;
  // Trial state
  isTrialSubscription: boolean;
};

type WizardAction =
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SELECT_PRICE"; price: StripePriceInterface }
  | { type: "SET_INTERVAL"; interval: BillingInterval }
  | { type: "SET_HAS_PAYMENT_METHOD"; hasMethod: boolean }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_PRORATION_PREVIEW"; preview: ProrationPreviewInterface | null }
  | { type: "SET_PROMOTION_CODE"; code: PromotionCodeValidationResult | null }
  | { type: "SET_VALIDATING_PROMO_CODE"; isValidating: boolean }
  | { type: "SET_PROMO_CODE_ERROR"; error: string | null }
  | { type: "SET_IS_TRIAL_SUBSCRIPTION"; isTrial: boolean }
  | { type: "RESET" };

const initialState: WizardState = {
  step: "plan-selection",
  selectedPrice: null,
  selectedInterval: "month",
  hasPaymentMethod: false,
  isProcessing: false,
  error: null,
  prorationPreview: null,
  promotionCode: null,
  isValidatingPromoCode: false,
  promoCodeError: null,
  isTrialSubscription: false,
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
    case "SET_PROMOTION_CODE":
      return { ...state, promotionCode: action.code, promoCodeError: null };
    case "SET_VALIDATING_PROMO_CODE":
      return { ...state, isValidatingPromoCode: action.isValidating };
    case "SET_PROMO_CODE_ERROR":
      return { ...state, promoCodeError: action.error };
    case "SET_IS_TRIAL_SUBSCRIPTION":
      return { ...state, isTrialSubscription: action.isTrial };
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
  const t = useTranslations();
  const locale = useI18nLocale();
  const { confirmPayment } = useConfirmSubscriptionPayment();
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

  /**
   * Puts the automatic code for this price (or none) in the wizard state, so the
   * review shows what the server would really charge. Returns false when the
   * lookup itself failed: the caller must then not show a price as the truth.
   */
  const lookUpAutomaticCode = useCallback(async (priceId: string): Promise<boolean> => {
    try {
      const automaticCode = await StripeCouponCodeService.findAutomatic({ priceId });
      dispatch({
        type: "SET_PROMOTION_CODE",
        code: automaticCode ? toPromotionCodeResult(automaticCode) : null,
      });
      return true;
    } catch (error) {
      console.error("[useSubscriptionWizard] Failed to look up the automatic promotion code:", error);
      dispatch({ type: "SET_PROMOTION_CODE", code: null });
      return false;
    }
  }, []);

  /**
   * Re-reads the automatic code after the review's code changed. When the lookup
   * fails, the review price cannot be trusted: back to plan selection.
   */
  const refreshAutomaticCodeOrLeaveReview = useCallback(
    async (priceId: string): Promise<void> => {
      const found = await lookUpAutomaticCode(priceId);
      if (!found) {
        // SET_STEP clears the error, so the error goes second
        dispatch({ type: "SET_STEP", step: "plan-selection" });
        dispatch({ type: "SET_ERROR", error: t("billing.ui.wizard.errors.prepare_review") });
      }
    },
    [lookUpAutomaticCode, t],
  );

  const goToReview = useCallback(async () => {
    if (!state.selectedPrice) return;

    dispatch({ type: "SET_PROCESSING", isProcessing: true });

    try {
      // Check payment method first
      await checkPaymentMethod();

      // Check if current subscription is trial
      const isTrialUpgrade = subscription?.status === SubscriptionStatus.TRIALING;
      dispatch({ type: "SET_IS_TRIAL_SUBSCRIPTION", isTrial: isTrialUpgrade });

      // For trial upgrades, require payment method before review
      if (isTrialUpgrade && !state.hasPaymentMethod) {
        const methods = await StripeCustomerService.listPaymentMethods();
        if (methods.length === 0) {
          dispatch({ type: "SET_STEP", step: "payment-method" });
          dispatch({
            type: "SET_ERROR",
            error: t("billing.ui.wizard.errors.payment_method_required"),
          });
          return;
        }
      }

      // Fill the automatic code for this price, unless the GM typed one
      // A failed lookup never shows full price as if nothing applied: stay off the review
      if (shouldLookUpAutomatic(state.promotionCode)) {
        const found = await lookUpAutomaticCode(state.selectedPrice.id);
        if (!found) {
          dispatch({ type: "SET_ERROR", error: t("billing.ui.wizard.errors.prepare_review") });
          return;
        }
      }

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
      dispatch({ type: "SET_ERROR", error: error?.message || t("billing.ui.wizard.errors.prepare_review") });
    } finally {
      dispatch({ type: "SET_PROCESSING", isProcessing: false });
    }
  }, [
    state.selectedPrice,
    state.hasPaymentMethod,
    state.promotionCode,
    subscription,
    checkPaymentMethod,
    lookUpAutomaticCode,
    t,
  ]);

  const confirmSubscription = useCallback(async () => {
    if (!state.selectedPrice) return;

    dispatch({ type: "SET_PROCESSING", isProcessing: true });
    dispatch({ type: "SET_ERROR", error: null });

    try {
      let result: StripeSubscriptionCreateResponse;
      if (subscription) {
        // Change existing subscription
        const changePlanParams = {
          id: subscription.id,
          newPriceId: state.selectedPrice.id,
          promotionCode: promotionCodeToSend(state.promotionCode),
        };
        result = await StripeSubscriptionService.changePlanWithMeta(changePlanParams);
      } else {
        // Create new subscription
        const createParams = {
          id: v4(),
          priceId: state.selectedPrice.id,
          promotionCode: promotionCodeToSend(state.promotionCode),
        };
        result = await StripeSubscriptionService.createSubscription(createParams);
      }

      // The first payment waits on the browser (confirmation, 3D Secure): until it
      // is confirmed nothing is paid, so the wizard stays open on a failure
      const clientSecret = clientSecretToConfirm(result.meta);
      if (clientSecret) {
        const confirmation = await confirmPayment(clientSecret);
        if (!confirmation.success) {
          console.error("[useSubscriptionWizard] Payment not confirmed:", confirmation.error);
          dispatch({
            type: "SET_ERROR",
            error: t("billing.ui.wizard.errors.payment_not_confirmed", { reason: confirmation.error ?? "" }),
          });
          return;
        }

        // Our copy is still incomplete until the webhooks land: store what Stripe has now,
        // so the billing page shows the plan at once. A failed sync never blocks success.
        const subscriptionId = subscriptionIdToSync(result.subscription, subscription);
        if (subscriptionId) {
          try {
            await StripeSubscriptionService.syncSubscription({ subscriptionId });
          } catch (syncError) {
            console.error("[useSubscriptionWizard] Subscription sync after payment failed:", syncError);
          }
        }
      }

      onSuccessRef.current();
      onCloseRef.current();
    } catch (error: any) {
      // 410 discount_sold_out (the automatic discount's last place has just gone) or
      // 422 discount_unavailable (the automatic code shown is no longer valid): nothing
      // was charged. Never retry: drop the code and re-read the automatic one, so the
      // review shows the price that would really be charged now.
      const soldOut = isDiscountSoldOut(error);
      if (soldOut || isDiscountUnavailable(error)) {
        dispatch({
          type: "SET_ERROR",
          error: soldOut
            ? t("billing.ui.wizard.errors.discount_sold_out")
            : t("billing.ui.wizard.errors.discount_unavailable"),
        });
        dispatch({ type: "SET_PROMOTION_CODE", code: null });
        await refreshAutomaticCodeOrLeaveReview(state.selectedPrice.id);
        return;
      }

      // Handle 409 Conflict - duplicate recurring subscription
      if (error?.status === 409 || error?.response?.status === 409) {
        dispatch({
          type: "SET_ERROR",
          error: t("billing.ui.wizard.errors.already_subscribed"),
        });
        return;
      }

      // Handle 402 - payment method required
      if (error?.status === 402 || error?.response?.status === 402) {
        dispatch({ type: "SET_HAS_PAYMENT_METHOD", hasMethod: false });
        dispatch({ type: "SET_STEP", step: "payment-method" });
        return;
      }

      dispatch({ type: "SET_ERROR", error: error?.message || t("billing.ui.wizard.errors.process_subscription") });
    } finally {
      dispatch({ type: "SET_PROCESSING", isProcessing: false });
    }
  }, [state.selectedPrice, state.promotionCode, subscription, refreshAutomaticCodeOrLeaveReview, confirmPayment, t]);

  const handlePaymentMethodSuccess = useCallback(async () => {
    dispatch({ type: "SET_HAS_PAYMENT_METHOD", hasMethod: true });
    // Prepare the review exactly as "Next: Review" does: the trial path sent the GM
    // here before the automatic-code lookup and the proration preview had run
    await goToReview();
  }, [goToReview]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const validatePromoCode = useCallback(
    async (code: string) => {
      dispatch({ type: "SET_VALIDATING_PROMO_CODE", isValidating: true });
      dispatch({ type: "SET_PROMO_CODE_ERROR", error: null });

      try {
        const result = await StripePromotionCodeService.validatePromotionCode({
          code,
          stripePriceId: state.selectedPrice?.id,
          language: locale,
        });

        if (result.valid) {
          dispatch({ type: "SET_PROMOTION_CODE", code: result });
        } else {
          dispatch({
            type: "SET_PROMO_CODE_ERROR",
            error: result.errorMessage || t("billing.ui.wizard.errors.invalid_promo_code"),
          });
        }
      } catch (error: any) {
        console.error("[useSubscriptionWizard] Promo code validation error:", error);
        dispatch({
          type: "SET_PROMO_CODE_ERROR",
          error: error?.message || t("billing.ui.wizard.errors.validate_promo_code"),
        });
      } finally {
        dispatch({ type: "SET_VALIDATING_PROMO_CODE", isValidating: false });
      }
    },
    [state.selectedPrice?.id, t, locale],
  );

  const clearPromoCode = useCallback(async () => {
    dispatch({ type: "SET_PROMOTION_CODE", code: null });
    dispatch({ type: "SET_PROMO_CODE_ERROR", error: null });
    dispatch({ type: "SET_ERROR", error: null });

    if (!state.selectedPrice) return;

    // Removing a typed code: the server attaches the automatic code again, so the
    // review must show it again
    dispatch({ type: "SET_PROCESSING", isProcessing: true });
    try {
      await refreshAutomaticCodeOrLeaveReview(state.selectedPrice.id);
    } finally {
      dispatch({ type: "SET_PROCESSING", isProcessing: false });
    }
  }, [state.selectedPrice, refreshAutomaticCodeOrLeaveReview]);

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
      validatePromoCode,
      clearPromoCode,
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
      validatePromoCode,
      clearPromoCode,
    ],
  );

  return {
    state,
    actions,
  };
}
