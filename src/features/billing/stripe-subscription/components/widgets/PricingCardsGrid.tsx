"use client";

import { Card, CardContent, CardFooter, CardHeader, Skeleton } from "../../../../../shadcnui";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeProductInterface } from "../../../stripe-product";
import { PricingCard } from "./PricingCard";

export type PricesByProduct = Map<string, StripePriceInterface[]>;

export type PricingCardsGridProps = {
  products: StripeProductInterface[];
  pricesByProduct: PricesByProduct;
  currentPriceId?: string;
  selectedPriceId?: string;
  loadingPriceId?: string;
  loading?: boolean;
  onSelectPrice: (price: StripePriceInterface) => void;
};

export function PricingCardsGrid({
  products,
  pricesByProduct,
  currentPriceId,
  selectedPriceId,
  loadingPriceId,
  loading = false,
  onSelectPrice,
}: PricingCardsGridProps) {
  if (loading) {
    return <PricingCardsGridSkeleton />;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No plans available
      </div>
    );
  }

  return (
    <div className="space-y-8" role="radiogroup" aria-label="Available pricing plans">
      {products.map((product) => {
        const prices = pricesByProduct.get(product.id) || [];
        if (prices.length === 0) return null;

        // Sort prices from cheapest to most expensive
        const sortedPrices = [...prices].sort((a, b) => (a.unitAmount ?? 0) - (b.unitAmount ?? 0));

        return (
          <div key={product.id} className="space-y-4">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPrices.map((price) => (
                <PricingCard
                  key={price.stripePriceId}
                  price={price}
                  isCurrentPlan={price.stripePriceId === currentPriceId}
                  isSelected={price.stripePriceId === selectedPriceId}
                  isLoading={price.stripePriceId === loadingPriceId}
                  onSelect={onSelectPrice}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PricingCardsGridSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((productIndex) => (
        <div key={productIndex} className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((cardIndex) => (
              <Card key={cardIndex} className="animate-pulse">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="mb-4">
                    <Skeleton className="h-9 w-20 inline-block" />
                    <Skeleton className="h-4 w-12 inline-block ml-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
