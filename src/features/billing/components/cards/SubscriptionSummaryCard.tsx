"use client";

import { ChevronRight, CreditCard } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "../../../../shadcnui";
import { StripeSubscriptionInterface, SubscriptionStatus } from "../../stripe-subscription";

type SubscriptionSummaryCardProps = {
  subscriptions: StripeSubscriptionInterface[];
  loading?: boolean;
  error?: string;
  onManageClick: () => void;
};

function getStatusBadgeVariant(status: SubscriptionStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "default";
    case SubscriptionStatus.TRIALING:
      return "secondary";
    case SubscriptionStatus.PAST_DUE:
    case SubscriptionStatus.UNPAID:
    case SubscriptionStatus.CANCELED:
      return "destructive";
    default:
      return "outline";
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(amount: number | undefined, currency: string | undefined): string {
  if (amount === undefined) return "N/A";
  const currencyCode = currency?.toUpperCase() || "USD";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100);
}

export function SubscriptionSummaryCard({
  subscriptions,
  loading,
  error,
  onManageClick,
}: SubscriptionSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIALING,
  );
  const primarySubscription = activeSubscriptions[0];

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onManageClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">No active plan</p>
            <p className="text-xs text-muted-foreground">Subscribe to get started</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onManageClick();
              }}
            >
              View Plans
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : primarySubscription ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">{primarySubscription.price?.product?.name || "Subscription"}</p>
              <Badge variant={getStatusBadgeVariant(primarySubscription.status)}>{primarySubscription.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatPrice(primarySubscription.price?.unitAmount, primarySubscription.price?.currency)}
              {primarySubscription.price?.recurring && <span>/{primarySubscription.price.recurring.interval}</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {primarySubscription.cancelAtPeriodEnd
                ? `Cancels on ${formatDate(primarySubscription.currentPeriodEnd)}`
                : `Renews on ${formatDate(primarySubscription.currentPeriodEnd)}`}
            </p>
            {activeSubscriptions.length > 1 && (
              <p className="text-xs text-muted-foreground">+{activeSubscriptions.length - 1} more subscription(s)</p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
