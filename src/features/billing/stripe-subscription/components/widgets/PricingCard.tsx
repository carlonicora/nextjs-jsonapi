"use client";

import { Check } from "lucide-react";
import { KeyboardEvent } from "react";
import { Badge, Button, Card, CardContent, CardFooter, CardHeader } from "../../../../../shadcnui";
import { formatCurrency, formatInterval } from "../../../components/utils";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { cn } from "../../../../../utils/cn";

export type PricingCardProps = {
  price: StripePriceInterface;
  isCurrentPlan?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onSelect: (price: StripePriceInterface) => void;
};

export function PricingCard({ price, isCurrentPlan = false, isSelected = false, isDisabled = false, isLoading = false, onSelect }: PricingCardProps) {
  const description = price.description || price.nickname || "Standard";
  const features = price.features || [];
  const formattedPrice = formatCurrency(price.unitAmount, price.currency);
  const interval = formatInterval(price);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !isDisabled && !isCurrentPlan) {
      e.preventDefault();
      onSelect(price);
    }
  };

  const handleClick = () => {
    if (!isDisabled && !isCurrentPlan && !isLoading) {
      onSelect(price);
    }
  };

  return (
    <Card
      role="radio"
      aria-checked={isSelected}
      aria-label={`${description} plan at ${formattedPrice} ${interval}`}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      className={cn(
        "relative cursor-pointer transition-all duration-200 flex flex-col h-full",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isCurrentPlan && "bg-muted/30",
        isSelected && !isCurrentPlan && "ring-2 ring-primary",
        !isDisabled && !isCurrentPlan && "hover:shadow-md hover:border-primary/50",
        isDisabled && "opacity-50 pointer-events-none",
        isLoading && "pointer-events-none"
      )}
    >
      {isCurrentPlan && (
        <Badge variant="secondary" className="absolute top-2 right-2">
          Current
        </Badge>
      )}

      <CardHeader className="pb-2">
        <h3 className="font-semibold text-lg">{description}</h3>
      </CardHeader>

      <CardContent className="pb-4 grow">
        <div className="mb-4">
          <span className="text-3xl font-bold">{formattedPrice}</span>
          <span className="text-muted-foreground ml-1">{interval}</span>
        </div>

        {features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant={isCurrentPlan ? "secondary" : isSelected ? "default" : "outline"}
          className="w-full"
          disabled={isDisabled || isCurrentPlan || isLoading}
        >
          {isLoading ? "Processing..." : isCurrentPlan ? "Current Plan" : isSelected ? "Selected" : "Select Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
}
