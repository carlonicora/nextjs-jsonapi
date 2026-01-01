"use client";

import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { Button } from "../../../../../shadcnui";
import { BillingAlertBanner } from "../../../components";
import { PaymentMethodEditor } from "../../../stripe-customer/components/forms/PaymentMethodEditor";
import { StripeCustomerService } from "../../../stripe-customer/data/stripe-customer.service";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeProductInterface, StripeProductService } from "../../../stripe-product";
import { StripeSubscriptionInterface, StripeSubscriptionService, SubscriptionStatus } from "../../data";
import { SubscriptionEditor } from "../forms";
import { SubscriptionsList } from "../lists";
import { PricesByProduct, PricingCardsGrid } from "../widgets/PricingCardsGrid";

export function SubscriptionsContainer() {
  const [subscriptions, setSubscriptions] = useState<StripeSubscriptionInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateSubscription, setShowCreateSubscription] = useState<boolean>(false);
  const [showPaymentMethodEditor, setShowPaymentMethodEditor] = useState<boolean>(false);

  // Pricing data for empty state
  const [products, setProducts] = useState<StripeProductInterface[]>([]);
  const [pricesByProduct, setPricesByProduct] = useState<PricesByProduct>(new Map());
  const [loadingPricing, setLoadingPricing] = useState<boolean>(false);

  // Payment method and pending subscription state
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
  const [creatingSubscription, setCreatingSubscription] = useState<boolean>(false);

  const loadSubscriptions = async () => {
    console.log("[SubscriptionsContainer] Loading subscriptions...");
    setLoading(true);
    try {
      const fetchedSubscriptions = await StripeSubscriptionService.listSubscriptions();
      console.log("[SubscriptionsContainer] Loaded subscriptions:", fetchedSubscriptions);
      setSubscriptions(fetchedSubscriptions);
    } catch (error) {
      console.error("[SubscriptionsContainer] Failed to load subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPricingData = async () => {
    console.log("[SubscriptionsContainer] Loading pricing data...");
    setLoadingPricing(true);
    try {
      const fetchedProducts = await StripeProductService.listProducts({ active: true });

      console.log("[SubscriptionsContainer] Loaded products with prices:", fetchedProducts);

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
      console.error("[SubscriptionsContainer] Failed to load pricing data:", error);
    } finally {
      setLoadingPricing(false);
    }
  };

  const checkPaymentMethod = async () => {
    console.log("[SubscriptionsContainer] Checking payment methods...");
    try {
      const paymentMethods = await StripeCustomerService.listPaymentMethods();
      const hasMethod = paymentMethods.length > 0;
      console.log("[SubscriptionsContainer] Has payment method:", hasMethod);
      setHasPaymentMethod(hasMethod);
    } catch (error) {
      console.error("[SubscriptionsContainer] Failed to check payment methods:", error);
      setHasPaymentMethod(false);
    }
  };

  const createSubscriptionWithPrice = async (priceId: string) => {
    console.log("[SubscriptionsContainer] Creating subscription with price:", priceId);
    setCreatingSubscription(true);
    try {
      await StripeSubscriptionService.createSubscription({
        id: v4(),
        priceId,
      });
      console.log("[SubscriptionsContainer] Subscription created successfully");
      await loadSubscriptions();
    } catch (error: any) {
      console.error("[SubscriptionsContainer] Failed to create subscription:", error);
      // Handle 402 error - payment method required despite our check
      if (error?.status === 402 || error?.response?.status === 402) {
        console.log("[SubscriptionsContainer] Payment method required, opening editor");
        setPendingPriceId(priceId);
        setHasPaymentMethod(false);
        setShowPaymentMethodEditor(true);
      }
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handleSelectPrice = async (price: StripePriceInterface) => {
    const priceId = price.id; // Use internal UUID, not Stripe ID

    if (!hasPaymentMethod) {
      console.log("[SubscriptionsContainer] No payment method, storing pending price:", priceId);
      setPendingPriceId(priceId);
      setShowPaymentMethodEditor(true);
      return;
    }

    await createSubscriptionWithPrice(priceId);
  };

  const handlePaymentMethodSuccess = async () => {
    console.log("[SubscriptionsContainer] Payment method added successfully");
    setShowPaymentMethodEditor(false);
    setHasPaymentMethod(true);

    if (pendingPriceId) {
      console.log("[SubscriptionsContainer] Creating subscription with pending price:", pendingPriceId);
      await createSubscriptionWithPrice(pendingPriceId);
      setPendingPriceId(null);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // Load pricing data when there are no subscriptions
  useEffect(() => {
    if (!loading && subscriptions.length === 0) {
      loadPricingData();
      checkPaymentMethod();
    }
  }, [loading, subscriptions.length]);

  // Detect critical subscriptions
  const criticalSubscriptions = subscriptions.filter(
    (sub) =>
      sub.status === SubscriptionStatus.PAST_DUE ||
      (sub.status === SubscriptionStatus.TRIALING &&
        sub.trialEnd &&
        new Date(sub.trialEnd).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000),
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <CreditCard className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Subscriptions</h1>
        </div>
        {subscriptions.length > 0 && (
          <Button onClick={() => setShowCreateSubscription(true)}>Subscribe to a Plan</Button>
        )}
      </div>

      {/* Alert Banners */}
      {criticalSubscriptions.map((subscription) => (
        <BillingAlertBanner key={subscription.id} subscription={subscription} />
      ))}

      {/* Pricing Cards when no subscriptions */}
      {subscriptions.length === 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <CreditCard className="text-muted-foreground mx-auto h-16 w-16 mb-4" />
            <h3 className="mb-2 text-xl font-semibold">Choose Your Plan</h3>
            <p className="text-muted-foreground mb-6">Select a subscription plan to get started with our services.</p>
          </div>

          <PricingCardsGrid
            products={products}
            pricesByProduct={pricesByProduct}
            loading={loadingPricing}
            loadingPriceId={creatingSubscription ? (pendingPriceId ?? undefined) : undefined}
            onSelectPrice={handleSelectPrice}
          />
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions.length > 0 && (
        <SubscriptionsList subscriptions={subscriptions} onSubscriptionsChange={loadSubscriptions} />
      )}

      {/* Create Subscription Modal (for users who already have subscriptions) */}
      {showCreateSubscription && (
        <SubscriptionEditor
          open={showCreateSubscription}
          onOpenChange={setShowCreateSubscription}
          onSuccess={loadSubscriptions}
          onAddPaymentMethod={() => {
            setShowCreateSubscription(false);
            setShowPaymentMethodEditor(true);
          }}
        />
      )}

      {/* Payment Method Editor Modal */}
      {showPaymentMethodEditor && (
        <PaymentMethodEditor
          open={showPaymentMethodEditor}
          onOpenChange={(open) => {
            setShowPaymentMethodEditor(open);
            if (!open) {
              // Clear pending price if user cancels
              setPendingPriceId(null);
            }
          }}
          onSuccess={handlePaymentMethodSuccess}
        />
      )}
    </div>
  );
}
