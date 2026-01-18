"use client";

import { Skeleton } from "../../../../../shadcnui";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeProductInterface } from "../../../stripe-product";
import { BillingInterval } from "./IntervalToggle";
import { ProductPricingRow } from "./ProductPricingRow";

export type ProductPricingListProps = {
  products: StripeProductInterface[];
  selectedInterval: BillingInterval;
  currentPriceId?: string;
  selectedPriceId?: string;
  loadingPriceId?: string;
  loading?: boolean;
  onSelectPrice: (price: StripePriceInterface) => void;
  hideRecurringPrices?: boolean;
  hideOneTimePrices?: boolean;
};

function isRecurringProduct(prices: StripePriceInterface[]): boolean {
  return prices.some((p) => p.priceType === "recurring");
}

function getFilteredPrices(prices: StripePriceInterface[], selectedInterval: BillingInterval): StripePriceInterface[] {
  const isRecurring = isRecurringProduct(prices);

  if (!isRecurring) {
    return prices.filter((p) => p.priceType === "one_time");
  }

  const intervalPrices = prices.filter(
    (p) => p.priceType === "recurring" && p.recurring?.interval === selectedInterval,
  );

  if (intervalPrices.length === 0) {
    const fallbackInterval = selectedInterval === "month" ? "year" : "month";
    return prices.filter((p) => p.priceType === "recurring" && p.recurring?.interval === fallbackInterval);
  }

  return intervalPrices;
}

export function ProductPricingList({
  products,
  selectedInterval,
  currentPriceId,
  selectedPriceId,
  loadingPriceId,
  loading = false,
  onSelectPrice,
  hideRecurringPrices = false,
  hideOneTimePrices = false,
}: ProductPricingListProps) {
  if (loading) {
    return <ProductPricingListSkeleton />;
  }

  if (products.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No plans available</div>;
  }

  const sortedProducts = [...products].sort((a, b) => {
    const aRecurring = isRecurringProduct(a.stripePrices || []);
    const bRecurring = isRecurringProduct(b.stripePrices || []);
    if (aRecurring && !bRecurring) return -1;
    if (!aRecurring && bRecurring) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {sortedProducts.map((product) => {
        const allPrices = product.stripePrices || [];

        // Filter prices based on hideRecurringPrices and hideOneTimePrices flags
        let pricesToFilter = allPrices;

        if (hideRecurringPrices) {
          pricesToFilter = pricesToFilter.filter((price) => price.priceType !== "recurring");
        }

        if (hideOneTimePrices) {
          pricesToFilter = pricesToFilter.filter((price) => price.priceType !== "one_time");
        }

        // Filter out trial prices - users shouldn't manually select trial plans
        pricesToFilter = pricesToFilter.filter((price) => !price.isTrial);

        const filteredPrices = getFilteredPrices(pricesToFilter, selectedInterval);

        if (filteredPrices.length === 0) {
          return null;
        }

        return (
          <ProductPricingRow
            key={product.id}
            product={product}
            prices={filteredPrices}
            currentPriceId={currentPriceId}
            selectedPriceId={selectedPriceId}
            loadingPriceId={loadingPriceId}
            onSelectPrice={onSelectPrice}
          />
        );
      })}
    </div>
  );
}

function ProductPricingListSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((rowIndex) => (
        <div key={rowIndex} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((cardIndex) => (
              <div key={cardIndex} className="p-4 rounded-lg border animate-pulse space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
