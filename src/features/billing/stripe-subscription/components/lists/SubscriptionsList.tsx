"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../shadcnui";
import {
  applyDiscount,
  formatCurrency,
  formatDate,
  subscriptionDiscount,
  useBillingFormatOptions,
} from "../../../components/utils";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeSubscriptionInterface, SubscriptionStatus } from "../../data";
import { SubscriptionDetails } from "../details/SubscriptionDetails";
import { SubscriptionStatusBadge } from "../widgets/SubscriptionStatusBadge";

/**
 * Formats the plan name from price data.
 * Format: "Product Name - Nickname (Interval)" e.g., "Only 35 - Pro (Monthly)"
 */
function formatPlanName(price: StripePriceInterface | undefined, t: ReturnType<typeof useTranslations>): string {
  if (!price) return t("billing.ui.not_available");

  const productName = price.product?.name || "";
  const nickname = price.nickname || "";

  // Format interval: "month" -> "Monthly", "year" -> "Yearly", etc.
  let interval = "";
  if (price.recurring?.interval) {
    const intervalMap: Record<string, string> = {
      day: t("billing.admin.prices.interval.day"),
      week: t("billing.admin.prices.interval.week"),
      month: t("billing.admin.prices.interval.month"),
      year: t("billing.admin.prices.interval.year"),
    };
    interval = intervalMap[price.recurring.interval] || price.recurring.interval;
  }

  // Build the plan label: "Product - Nickname" or just "Product"
  const parts = [productName, nickname].filter(Boolean);
  const planLabel = parts.join(" - ");

  // Add interval in parentheses if available
  return interval ? `${planLabel} (${interval})` : planLabel || t("billing.ui.not_available");
}

type SubscriptionsListProps = {
  subscriptions: StripeSubscriptionInterface[];
  onSubscriptionsChange: () => void;
  onChangePlan?: (subscription: StripeSubscriptionInterface) => void;
};

export function SubscriptionsList({ subscriptions, onSubscriptionsChange, onChangePlan }: SubscriptionsListProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const [selectedSub, setSelectedSub] = useState<StripeSubscriptionInterface | null>(null);

  const handleRowClick = (subscription: StripeSubscriptionInterface) => {
    setSelectedSub(subscription);
  };

  return (
    <>
      <div className="border rounded-lg overflow-clip">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>{t("billing.ui.columns.status")}</TableHead>
              <TableHead>{t("billing.ui.columns.plan")}</TableHead>
              <TableHead>{t("billing.ui.columns.period")}</TableHead>
              <TableHead className="text-end">{t("billing.ui.columns.amount")}</TableHead>
              <TableHead className="text-end">{t("billing.ui.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => {
              const price = subscription.price;
              const amount = price?.unitAmount ? formatCurrency(price.unitAmount, price.currency, fmt) : "0";
              // What Stripe bills: the price after the discount the subscription carries.
              const discountedAmount = price
                ? applyDiscount(price.unitAmount, subscriptionDiscount(subscription))
                : null;
              const period = `${formatDate(subscription.currentPeriodStart, fmt)} - ${formatDate(subscription.currentPeriodEnd, fmt)}`;

              return (
                <TableRow
                  key={subscription.id}
                  onClick={() => handleRowClick(subscription)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <SubscriptionStatusBadge
                      status={subscription.status}
                      cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{formatPlanName(price, t)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{period}</TableCell>
                  <TableCell className="text-end font-medium">
                    {discountedAmount !== null && price ? (
                      <>
                        <span className="line-through text-muted-foreground me-2">{amount}</span>
                        <span className="text-success">{formatCurrency(discountedAmount, price.currency, fmt)}</span>
                      </>
                    ) : (
                      amount
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    {(subscription.status === SubscriptionStatus.ACTIVE ||
                      subscription.status === SubscriptionStatus.TRIALING) &&
                      onChangePlan && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangePlan(subscription);
                          }}
                        >
                          {t("billing.ui.subscription.upgrade")}
                        </Button>
                      )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Subscription Details Dialog */}
      {selectedSub && (
        <SubscriptionDetails
          subscription={selectedSub}
          open={!!selectedSub}
          onOpenChange={(open) => !open && setSelectedSub(null)}
          onSubscriptionChange={() => {
            onSubscriptionsChange();
            setSelectedSub(null);
          }}
          onChangePlan={
            onChangePlan
              ? (sub) => {
                  setSelectedSub(null); // Close details dialog first
                  onChangePlan(sub); // Then open wizard at parent level
                }
              : undefined
          }
        />
      )}
    </>
  );
}
