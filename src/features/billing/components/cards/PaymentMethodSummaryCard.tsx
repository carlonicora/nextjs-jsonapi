"use client";

import { Wallet, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from "../../../../shadcnui";
import { PaymentMethodInterface } from "../../stripe-customer";

type PaymentMethodSummaryCardProps = {
  paymentMethods: PaymentMethodInterface[];
  defaultPaymentMethodId?: string;
  loading?: boolean;
  error?: string;
  onManageClick: () => void;
};

function getCardBrandIcon(brand: string): string {
  const brandMap: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "Amex",
    discover: "Discover",
    diners: "Diners",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return brandMap[brand.toLowerCase()] || brand;
}

export function PaymentMethodSummaryCard({
  paymentMethods,
  defaultPaymentMethodId,
  loading,
  error,
  onManageClick,
}: PaymentMethodSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Find default payment method or use first one
  const defaultMethod = paymentMethods.find((pm) => pm.id === defaultPaymentMethodId) || paymentMethods[0];

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onManageClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">No payment method</p>
            <p className="text-xs text-muted-foreground">
              Add a card to enable subscriptions
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); onManageClick(); }}>
              Add Card
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : defaultMethod?.card ? (
          <div className="space-y-2">
            <p className="text-xl font-bold">
              {getCardBrandIcon(defaultMethod.card.brand)} ****{defaultMethod.card.last4}
            </p>
            <p className="text-sm text-muted-foreground">
              Expires {String(defaultMethod.card.expMonth).padStart(2, "0")}/{defaultMethod.card.expYear}
            </p>
            {paymentMethods.length > 1 && (
              <p className="text-xs text-muted-foreground">
                +{paymentMethods.length - 1} more card(s)
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xl font-bold">{defaultMethod?.type || "Payment Method"}</p>
            {paymentMethods.length > 1 && (
              <p className="text-xs text-muted-foreground">
                +{paymentMethods.length - 1} more method(s)
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
