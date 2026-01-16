"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../shadcnui";
import { formatCurrency, formatDate } from "../../../components/utils";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeSubscriptionInterface } from "../../data";
import { SubscriptionDetails } from "../details/SubscriptionDetails";
import { SubscriptionStatusBadge } from "../widgets/SubscriptionStatusBadge";

/**
 * Formats the plan name from price data.
 * Format: "Product Name - Nickname (Interval)" e.g., "Only 35 - Pro (Monthly)"
 */
function formatPlanName(price: StripePriceInterface | undefined): string {
  if (!price) return "N/A";

  const productName = price.product?.name || "";
  const nickname = price.nickname || "";

  // Format interval: "month" -> "Monthly", "year" -> "Yearly", etc.
  let interval = "";
  if (price.recurring?.interval) {
    const intervalMap: Record<string, string> = {
      day: "Daily",
      week: "Weekly",
      month: "Monthly",
      year: "Yearly",
    };
    interval = intervalMap[price.recurring.interval] || price.recurring.interval;
  }

  // Build the plan label: "Product - Nickname" or just "Product"
  const parts = [productName, nickname].filter(Boolean);
  const planLabel = parts.join(" - ");

  // Add interval in parentheses if available
  return interval ? `${planLabel} (${interval})` : planLabel || "N/A";
}

type SubscriptionsListProps = {
  subscriptions: StripeSubscriptionInterface[];
  onSubscriptionsChange: () => void;
  onChangePlan?: (subscription: StripeSubscriptionInterface) => void;
};

export function SubscriptionsList({ subscriptions, onSubscriptionsChange, onChangePlan }: SubscriptionsListProps) {
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
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => {
              const price = subscription.price;
              const amount = price?.unitAmount ? formatCurrency(price.unitAmount, price.currency) : "N/A";
              const period = `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`;

              return (
                <TableRow
                  key={subscription.id}
                  onClick={() => handleRowClick(subscription)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <SubscriptionStatusBadge status={subscription.status} cancelAtPeriodEnd={subscription.cancelAtPeriodEnd} />
                  </TableCell>
                  <TableCell className="font-medium">{formatPlanName(price)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{period}</TableCell>
                  <TableCell className="text-right font-medium">{amount}</TableCell>
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
