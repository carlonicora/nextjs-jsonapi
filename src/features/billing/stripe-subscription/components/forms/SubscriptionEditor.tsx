"use client";

import { useEffect, useState } from "react";
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
import { PricesByProduct, PricingCardsGrid } from "../widgets/PricingCardsGrid";
import { ProrationPreview } from "../widgets/ProrationPreview";

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

      console.log("[SubscriptionEditor] Checking payment methods...");
      setLoadingPaymentMethods(true);
      try {
        const paymentMethods = await StripeCustomerService.listPaymentMethods();
        const hasMethod = paymentMethods.length > 0;
        console.log("[SubscriptionEditor] Payment methods found:", hasMethod);
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
      console.log("[SubscriptionEditor] Loading products with prices...");
      setLoading(true);
      try {
        const fetchedProducts = await StripeProductService.listProducts({ active: true });

        console.log("[SubscriptionEditor] Loaded products with prices:", fetchedProducts);

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

      console.log("[SubscriptionEditor] Loading proration preview...");
      setLoadingProration(true);
      try {
        const preview = await StripeSubscriptionService.getProrationPreview({
          subscriptionId: subscription.id,
          newPriceId: selectedPriceId,
        });
        console.log("[SubscriptionEditor] Loaded proration preview:", preview);
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
      console.log("[SubscriptionEditor] Creating subscription with price:", priceId);
      setLoadingPriceId(priceId);
      setSelectedPriceId(priceId);

      try {
        await StripeSubscriptionService.createSubscription({
          id: crypto.randomUUID(),
          priceId,
        });
        console.log("[SubscriptionEditor] Subscription created successfully");
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error("[SubscriptionEditor] Failed to create subscription:", error);
        // Handle 402 Payment Required error
        if (error?.status === 402 || error?.response?.status === 402) {
          console.log("[SubscriptionEditor] Payment method required");
          setPaymentRequiredError(true);
          setHasPaymentMethod(false);
        }
      } finally {
        setLoadingPriceId(null);
      }
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!subscription || !selectedPriceId) return;

    console.log("[SubscriptionEditor] Changing plan to:", selectedPriceId);
    setLoadingPriceId(selectedPriceId);

    try {
      await StripeSubscriptionService.changePlan({
        subscriptionId: subscription.id,
        newPriceId: selectedPriceId,
      });
      console.log("[SubscriptionEditor] Plan changed successfully");
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
