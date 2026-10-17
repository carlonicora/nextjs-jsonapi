"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, CreditCard } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "../../../../shadcnui";
import { StripeSubscriptionInterface, SubscriptionStatus } from "../../stripe-subscription";
import { formatDate, useBillingFormatOptions } from "../utils";

type SubscriptionSummaryCardProps = {
  subscriptions: StripeSubscriptionInterface[];
  loading?: boolean;
  error?: string;
  onManageClick: () => void;
};

/** Statuses with a `billing.ui.subscription_status.*` label; anything else Stripe adds is shown raw. */
const SUBSCRIPTION_STATUSES: string[] = Object.values(SubscriptionStatus);

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

function formatPlanName(subscription: StripeSubscriptionInterface, fallback: string): string {
  const productName = subscription.price?.product?.name || "";
  const nickname = subscription.price?.nickname || "";

  if (productName && nickname) {
    return `${productName} - ${nickname}`;
  }
  return productName || nickname || fallback;
}

export function SubscriptionSummaryCard({
  subscriptions,
  loading,
  error,
  onManageClick,
}: SubscriptionSummaryCardProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t("billing.ui.subscriptions.title")}</CardTitle>
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
          <CardTitle>{t("billing.ui.subscriptions.title")}</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-xs/relaxed">{error}</p>
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
        <CardTitle>{t("billing.ui.subscriptions.title")}</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">{t("billing.ui.cards.subscriptions.empty_title")}</p>
            <p className="text-xs text-muted-foreground">{t("billing.ui.cards.subscriptions.empty_description")}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onManageClick();
              }}
            >
              {t("billing.ui.cards.subscriptions.view_plans")}
              <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
            </Button>
          </div>
        ) : primarySubscription ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">
                {formatPlanName(primarySubscription, t("billing.ui.cards.subscriptions.fallback_name"))}
              </p>
              <Badge
                variant={
                  primarySubscription.cancelAtPeriodEnd
                    ? "secondary"
                    : getStatusBadgeVariant(primarySubscription.status)
                }
              >
                {primarySubscription.cancelAtPeriodEnd
                  ? t("billing.ui.cards.subscriptions.canceling")
                  : SUBSCRIPTION_STATUSES.includes(primarySubscription.status)
                    ? t(`billing.ui.subscription_status.${primarySubscription.status}`)
                    : primarySubscription.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {!primarySubscription.price?.isTrial
                ? t("billing.ui.cards.subscriptions.ends_on", {
                    date: formatDate(primarySubscription.currentPeriodEnd, fmt),
                  })
                : primarySubscription.cancelAtPeriodEnd
                  ? t("billing.ui.cards.subscriptions.cancels_on", {
                      date: formatDate(primarySubscription.currentPeriodEnd, fmt),
                    })
                  : t("billing.ui.cards.subscriptions.renews_on", {
                      date: formatDate(primarySubscription.currentPeriodEnd, fmt),
                    })}
            </p>
            {activeSubscriptions.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {t("billing.ui.cards.subscriptions.more", { count: activeSubscriptions.length - 1 })}
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
