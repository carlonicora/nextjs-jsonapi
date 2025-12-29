"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shadcnui";
import { SubscriptionInterface } from "../../data/billing.interface";
import { formatCurrency, formatDate } from "../utils";
import { SubscriptionStatusBadge } from "../widgets/SubscriptionStatusBadge";
import { SubscriptionDetails } from "../details/SubscriptionDetails";

type SubscriptionsListProps = {
  subscriptions: SubscriptionInterface[];
  onSubscriptionsChange: () => void;
};

export function SubscriptionsList({ subscriptions, onSubscriptionsChange }: SubscriptionsListProps) {
  const [selectedSub, setSelectedSub] = useState<SubscriptionInterface | null>(null);

  const handleRowClick = (subscription: SubscriptionInterface) => {
    console.log("[SubscriptionsList] Opening subscription details:", subscription.id);
    setSelectedSub(subscription);
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
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
              const firstItem = subscription.items?.[0];
              const amount = firstItem ? formatCurrency(0, "usd") : "N/A"; // We'll need to get price details
              const period = `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`;

              return (
                <TableRow
                  key={subscription.id}
                  onClick={() => handleRowClick(subscription)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <SubscriptionStatusBadge status={subscription.status} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {firstItem?.priceId || "N/A"}
                  </TableCell>
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
        />
      )}
    </>
  );
}
