"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "../../../../../shadcnui";
import { formatCurrency, formatInterval } from "../../../components/utils";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";

type SubscriptionConfirmationProps = {
  price: StripePriceInterface;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SubscriptionConfirmation({ price, isLoading, onConfirm, onCancel }: SubscriptionConfirmationProps) {
  const productName = price.product?.name || price.nickname || "Selected Plan";
  const productDescription = price.product?.description || price.description;
  const features = price.features || [];

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
      <h4 className="font-semibold mb-3">Confirm Your Subscription</h4>

      <div className="space-y-3">
        {/* Plan name and description */}
        <div>
          <div className="font-medium">{productName}</div>
          {productDescription && <div className="text-sm text-muted-foreground">{productDescription}</div>}
        </div>

        {/* Price */}
        <div className="text-lg font-semibold">
          {formatCurrency(price.unitAmount, price.currency)}
          <span className="text-sm font-normal text-muted-foreground">{formatInterval(price)}</span>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="space-y-1">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm ">
                <Check className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-accent/30">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
