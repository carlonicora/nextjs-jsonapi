"use client";

import { CreditCard } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../shadcnui";
import { BillingAlertBanner } from "../../../components";
import { StripeSubscriptionInterface, StripeSubscriptionService, SubscriptionStatus } from "../../data";
import { SubscriptionsList } from "../lists";

type SubscriptionsContainerProps = {
  onOpenWizard?: (subscription?: StripeSubscriptionInterface) => void;
  hasActiveRecurringSubscription?: boolean;
};

export function SubscriptionsContainer({ onOpenWizard, hasActiveRecurringSubscription }: SubscriptionsContainerProps) {
  const [subscriptions, setSubscriptions] = useState<StripeSubscriptionInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSubscriptions = await StripeSubscriptionService.listSubscriptions();
      setSubscriptions(fetchedSubscriptions);
    } catch (error) {
      console.error("[SubscriptionsContainer] Failed to load subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // Detect critical subscriptions
  const criticalSubscriptions = subscriptions.filter(
    (sub) =>
      sub.status === SubscriptionStatus.PAST_DUE ||
      (sub.status === SubscriptionStatus.TRIALING &&
        sub.trialEnd &&
        new Date(sub.trialEnd).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000),
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <CreditCard className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Subscriptions</h1>
        </div>
        {subscriptions.length > 0 && (
          <Button onClick={() => onOpenWizard?.()}>
            {hasActiveRecurringSubscription ? "Purchase Add-ons" : "Subscribe to a Plan"}
          </Button>
        )}
      </div>

      {/* Alert Banners */}
      {criticalSubscriptions.map((subscription) => (
        <BillingAlertBanner key={subscription.id} subscription={subscription} />
      ))}

      {/* Empty state CTA */}
      {subscriptions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <CreditCard className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-muted-foreground mb-6">
              Choose a subscription plan to get started with our services.
            </p>
            <Button onClick={() => onOpenWizard?.()}>Subscribe to a Plan</Button>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions.length > 0 && (
        <SubscriptionsList
          subscriptions={subscriptions}
          onSubscriptionsChange={loadSubscriptions}
          onChangePlan={(sub) => onOpenWizard?.(sub)}
        />
      )}
    </div>
  );
}
