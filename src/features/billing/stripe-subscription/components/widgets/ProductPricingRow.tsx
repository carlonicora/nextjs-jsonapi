"use client";

import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeProductInterface } from "../../../stripe-product";
import { PricingCard } from "./PricingCard";

export type ProductPricingRowProps = {
  product: StripeProductInterface;
  prices: StripePriceInterface[];  // Multiple prices for this product
  currentPriceId?: string;
  selectedPriceId?: string;
  loadingPriceId?: string;
  onSelectPrice: (price: StripePriceInterface) => void;
};

export function ProductPricingRow({
  product,
  prices,
  currentPriceId,
  selectedPriceId,
  loadingPriceId,
  onSelectPrice,
}: ProductPricingRowProps) {
  if (prices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Product name header */}
      <h3 className="font-semibold text-lg">{product.name}</h3>

      {/* Price cards in columns */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        role="radiogroup"
        aria-label={`Pricing options for ${product.name}`}
      >
        {prices.map((price) => (
          <PricingCard
            key={price.id}
            price={price}
            isCurrentPlan={price.id === currentPriceId}
            isSelected={price.id === selectedPriceId}
            isLoading={price.id === loadingPriceId}
            onSelect={onSelectPrice}
          />
        ))}
      </div>
    </div>
  );
}
