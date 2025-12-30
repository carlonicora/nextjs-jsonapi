"use client";

import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../shadcnui";
import { BillingService } from "../../data/billing.service";
import { SubscriptionInterface, SubscriptionStatus } from "../../data/subscription.interface";
import { SubscriptionEditor } from "../forms/SubscriptionEditor";
import { SubscriptionsList } from "../lists/SubscriptionsList";
import { BillingAlertBanner } from "../widgets/BillingAlertBanner";

export function SubscriptionsContainer() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateSubscription, setShowCreateSubscription] = useState<boolean>(false);

  const loadSubscriptions = async () => {
    console.log("[SubscriptionsContainer] Loading subscriptions...");
    setLoading(true);
    try {
      const fetchedSubscriptions = await BillingService.listSubscriptions();
      console.log("[SubscriptionsContainer] Loaded subscriptions:", fetchedSubscriptions);
      setSubscriptions(fetchedSubscriptions);
    } catch (error) {
      console.error("[SubscriptionsContainer] Failed to load subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <Button onClick={() => setShowCreateSubscription(true)}>Subscribe to a Plan</Button>
      </div>

      {/* Alert Banners */}
      {criticalSubscriptions.map((subscription) => (
        <BillingAlertBanner key={subscription.id} subscription={subscription} />
      ))}

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <div className="bg-muted/50 flex flex-col items-center justify-center gap-y-4 rounded-lg border-2 border-dashed p-12">
          <CreditCard className="text-muted-foreground h-16 w-16" />
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">No active subscriptions</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to a plan to get started with our services.
            </p>
            <Button onClick={() => setShowCreateSubscription(true)}>Get Started</Button>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions.length > 0 && (
        <SubscriptionsList subscriptions={subscriptions} onSubscriptionsChange={loadSubscriptions} />
      )}

      {/* Create Subscription Modal */}
      {showCreateSubscription && (
        <SubscriptionEditor
          open={showCreateSubscription}
          onOpenChange={setShowCreateSubscription}
          onSuccess={loadSubscriptions}
        />
      )}
    </div>
  );
}
