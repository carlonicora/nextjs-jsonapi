"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../../shadcnui";
import { StripeCustomerService } from "../../../stripe-customer/data/stripe-customer.service";
import { ProrationPreviewInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeProductInterface, StripeProductService } from "../../../stripe-product";
import { StripeSubscriptionInterface, StripeSubscriptionService } from "../../data";
import { useConfirmSubscriptionPayment } from "../../hooks";
import { PricesByProduct, PricingCardsGrid } from "../widgets/PricingCardsGrid";
import { ProrationPreview } from "../widgets/ProrationPreview";

type PaymentConfirmationState = "idle" | "confirming" | "success" | "error";

type SubscriptionEditorProps = {
  subscription?: StripeSubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onAddPaymentMethod?: () => void;
};

export function SubscriptionEditor({
  subscription,
  open,
  onOpenChange,
  onSuccess,
  onAddPaymentMethod,
}: SubscriptionEditorProps) {
  const { confirmPayment, isConfirming } = useConfirmSubscriptionPayment();

  const [products, setProducts] = useState<StripeProductInterface[]>([]);
  const [pricesByProduct, setPricesByProduct] = useState<PricesByProduct>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [prorationPreview, setProrationPreview] = useState<ProrationPreviewInterface | null>(null);
  const [loadingProration, setLoadingProration] = useState<boolean>(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean>(true);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState<boolean>(true);
  const [paymentRequiredError, setPaymentRequiredError] = useState<boolean>(false);
  const [paymentConfirmationState, setPaymentConfirmationState] = useState<PaymentConfirmationState>("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Get current subscription price if editing
  const currentPriceId = subscription?.price?.stripePriceId;
  const isEditMode = !!subscription;

  // Check payment methods on mount (only for new subscriptions)
  useEffect(() => {
    const checkPaymentMethods = async () => {
      if (subscription) {
        // Editing existing subscription doesn't need payment method check
        setLoadingPaymentMethods(false);
        return;
      }

      setLoadingPaymentMethods(true);
      try {
        const paymentMethods = await StripeCustomerService.listPaymentMethods();
        const hasMethod = paymentMethods.length > 0;
        setHasPaymentMethod(hasMethod);
      } catch (error) {
        console.error("[SubscriptionEditor] Failed to check payment methods:", error);
        setHasPaymentMethod(false);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    if (open) {
      checkPaymentMethods();
    }
  }, [open, subscription]);

  // Load products with prices on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const fetchedProducts = await StripeProductService.listProducts({ active: true });

        // Build prices map from product.stripePrices
        const grouped: PricesByProduct = new Map();
        for (const product of fetchedProducts) {
          if (product.stripePrices && product.stripePrices.length > 0) {
            grouped.set(product.id, product.stripePrices);
          }
        }

        setProducts(fetchedProducts);
        setPricesByProduct(grouped);
      } catch (error) {
        console.error("[SubscriptionEditor] Failed to load products/prices:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Load proration preview when editing and price is selected
  useEffect(() => {
    const loadProration = async () => {
      if (!subscription || !selectedPriceId || selectedPriceId === currentPriceId) {
        setProrationPreview(null);
        return;
      }

      setLoadingProration(true);
      try {
        const preview = await StripeSubscriptionService.getProrationPreview({
          subscriptionId: subscription.id,
          newPriceId: selectedPriceId,
        });
        setProrationPreview(preview);
      } catch (error) {
        console.error("[SubscriptionEditor] Failed to load proration preview:", error);
        setProrationPreview(null);
      } finally {
        setLoadingProration(false);
      }
    };

    loadProration();
  }, [selectedPriceId, subscription, currentPriceId]);

  const handleSelectPrice = async (price: StripePriceInterface) => {
    const priceId = price.stripePriceId;

    if (isEditMode) {
      // Edit mode: just select the price to show proration preview
      setSelectedPriceId(priceId);
    } else {
      // Create mode: immediately create subscription
      setLoadingPriceId(priceId);
      setSelectedPriceId(priceId);
      setPaymentError(null);
      setPaymentConfirmationState("idle");

      try {
        const result = await StripeSubscriptionService.createSubscription({
          id: v4(),
          priceId,
        });

        // Check if payment confirmation is required (SCA flow)
        if (result.meta.requiresAction && result.meta.clientSecret) {
          setPaymentConfirmationState("confirming");

          const confirmation = await confirmPayment(result.meta.clientSecret);

          if (!confirmation.success) {
            console.error("[SubscriptionEditor] Payment confirmation failed:", confirmation.error);
            setPaymentConfirmationState("error");
            setPaymentError(confirmation.error || "Payment confirmation failed");
            setLoadingPriceId(null);
            return;
          }

          // Sync subscription to get updated status from Stripe
          await StripeSubscriptionService.syncSubscription({
            subscriptionId: result.subscription.id,
          });
        }

        // Success - show brief success state then close
        setPaymentConfirmationState("success");
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 1000);
      } catch (error: any) {
        console.error("[SubscriptionEditor] Failed to create subscription:", error);
        // Handle 402 Payment Required error
        if (error?.status === 402 || error?.response?.status === 402) {
          setPaymentRequiredError(true);
          setHasPaymentMethod(false);
        } else {
          setPaymentConfirmationState("error");
          setPaymentError(error?.message || "Failed to create subscription");
        }
        setLoadingPriceId(null);
      }
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!subscription || !selectedPriceId) return;

    setLoadingPriceId(selectedPriceId);

    try {
      await StripeSubscriptionService.changePlan({
        subscriptionId: subscription.id,
        newPriceId: selectedPriceId,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("[SubscriptionEditor] Failed to change plan:", error);
    } finally {
      setLoadingPriceId(null);
    }
  };

  const handleCancel = () => {
    setSelectedPriceId(null);
    setProrationPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subscription ? "Change Plan" : "Subscribe to a Plan"}</DialogTitle>
          <DialogDescription>
            {subscription
              ? "Select a new plan to switch to. You'll see a proration preview before confirming."
              : "Choose a plan to start your subscription."}
          </DialogDescription>
        </DialogHeader>

        {loadingPaymentMethods && !subscription ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Checking payment methods...</div>
          </div>
        ) : !hasPaymentMethod && !subscription ? (
          <Alert variant="destructive">
            <AlertTitle>Payment Method Required</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                {paymentRequiredError
                  ? "Your subscription could not be created because no payment method is on file."
                  : "You need to add a payment method before you can subscribe to a plan."}
              </p>
              {onAddPaymentMethod && (
                <Button onClick={onAddPaymentMethod} variant="outline">
                  Add Payment Method
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : paymentConfirmationState === "confirming" || isConfirming ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Processing payment...</p>
              <p className="text-sm text-muted-foreground">Please complete any verification if prompted.</p>
            </div>
          </div>
        ) : paymentConfirmationState === "success" ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="font-medium text-green-600">Payment successful!</p>
              <p className="text-sm text-muted-foreground">Your subscription is now active.</p>
            </div>
          </div>
        ) : paymentConfirmationState === "error" ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Payment Failed</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4">{paymentError || "We couldn't process your payment. Please try again."}</p>
                <Button
                  onClick={() => {
                    setPaymentConfirmationState("idle");
                    setPaymentError(null);
                    setLoadingPriceId(null);
                  }}
                  variant="outline"
                >
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-6">
            <PricingCardsGrid
              products={products}
              pricesByProduct={pricesByProduct}
              currentPriceId={currentPriceId}
              selectedPriceId={selectedPriceId ?? undefined}
              loadingPriceId={loadingPriceId ?? undefined}
              loading={loading}
              onSelectPrice={handleSelectPrice}
            />

            {isEditMode && loadingProration && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
                Loading proration preview...
              </div>
            )}

            {isEditMode && prorationPreview && !loadingProration && (
              <div className="space-y-4">
                <ProrationPreview preview={prorationPreview} />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleCancel} disabled={!!loadingPriceId}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmPlanChange} disabled={!!loadingPriceId}>
                    {loadingPriceId ? "Processing..." : "Confirm Plan Change"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
