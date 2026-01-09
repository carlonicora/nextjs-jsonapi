"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../../../shadcnui";
import { StripeProductInterface, StripeProductService } from "../../../stripe-product";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { BillingInterval, IntervalToggle } from "../widgets/IntervalToggle";
import { ProductPricingList } from "../widgets/ProductPricingList";

type WizardStepPlanSelectionProps = {
  selectedPrice: StripePriceInterface | null;
  selectedInterval: BillingInterval;
  currentPriceId?: string;
  hideRecurringPrices: boolean;
  onSelectPrice: (price: StripePriceInterface) => void;
  onIntervalChange: (interval: BillingInterval) => void;
  onNext: () => void;
  isProcessing: boolean;
};

export function WizardStepPlanSelection({
  selectedPrice,
  selectedInterval,
  currentPriceId,
  hideRecurringPrices,
  onSelectPrice,
  onIntervalChange,
  onNext,
  isProcessing,
}: WizardStepPlanSelectionProps) {
  const [products, setProducts] = useState<StripeProductInterface[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await StripeProductService.listProducts({ active: true });
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("[WizardStepPlanSelection] Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Compute available intervals from products
  const { hasMonthly, hasYearly } = useMemo(() => {
    let hasMonthly = false;
    let hasYearly = false;

    for (const product of products) {
      for (const price of product.stripePrices || []) {
        if (price.priceType === "recurring" && price.recurring?.interval === "month") {
          hasMonthly = true;
        }
        if (price.priceType === "recurring" && price.recurring?.interval === "year") {
          hasYearly = true;
        }
      }
    }

    return { hasMonthly, hasYearly };
  }, [products]);

  const handleSelectPrice = (price: StripePriceInterface) => {
    onSelectPrice(price);
  };

  return (
    <div className="space-y-6">
      {/* Interval Toggle */}
      <div className="flex justify-center">
        <IntervalToggle
          value={selectedInterval}
          onChange={onIntervalChange}
          hasMonthly={hasMonthly}
          hasYearly={hasYearly}
        />
      </div>

      {/* Product Pricing List */}
      <ProductPricingList
        products={products}
        selectedInterval={selectedInterval}
        currentPriceId={currentPriceId}
        selectedPriceId={selectedPrice?.id}
        loading={loading}
        hideRecurringPrices={hideRecurringPrices}
        onSelectPrice={handleSelectPrice}
      />

      {/* Action Buttons */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onNext} disabled={!selectedPrice || isProcessing}>
          {isProcessing ? "Loading..." : "Next: Review"}
        </Button>
      </div>
    </div>
  );
}
