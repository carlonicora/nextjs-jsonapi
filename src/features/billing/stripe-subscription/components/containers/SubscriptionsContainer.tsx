"use client";

import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../shadcnui";
import { BillingAlertBanner } from "../../../components";
import { StripeSubscriptionInterface, StripeSubscriptionService, SubscriptionStatus } from "../../data";
import type { RenderCancelDialog } from "../details/SubscriptionDetails";
import { SubscriptionsList } from "../lists";

type SubscriptionsContainerProps = {
  onOpenWizard?: (subscription?: StripeSubscriptionInterface) => void;
  hasActiveRecurringSubscription?: boolean;
  /**
   * The list a parent already holds (the billing dashboard). When given, the container
   * shows it instead of loading its own, and a change asks the parent to refresh through
   * `onSubscriptionsChange`, so the dialog and the cards behind it never disagree.
   */
  subscriptions?: StripeSubscriptionInterface[];
  onSubscriptionsChange?: () => void;
  /** Replaces the library cancel dialog; absent, the library dialog renders. */
  renderCancelDialog?: RenderCancelDialog;
};

export function SubscriptionsContainer({
  onOpenWizard,
  hasActiveRecurringSubscription,
  subscriptions: parentSubscriptions,
  onSubscriptionsChange,
  renderCancelDialog,
}: SubscriptionsContainerProps) {
  const t = useTranslations();
  const isControlled = parentSubscriptions !== undefined;
  const [ownSubscriptions, setSubscriptions] = useState<StripeSubscriptionInterface[]>([]);
  const [ownLoading, setLoading] = useState<boolean>(!isControlled);
  const subscriptions = parentSubscriptions ?? ownSubscriptions;
  const loading = isControlled ? false : ownLoading;

  const loadSubscriptions = useCallback(async () => {
    if (isControlled) {
      onSubscriptionsChange?.();
      return;
    }
    setLoading(true);
    try {
      const fetchedSubscriptions = await StripeSubscriptionService.listSubscriptions();
      setSubscriptions(fetchedSubscriptions);
    } catch (error) {
      console.error("[SubscriptionsContainer] Failed to load subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [isControlled, onSubscriptionsChange]);

  useEffect(() => {
    if (!isControlled) loadSubscriptions();
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
        <p className="text-muted-foreground">{t("billing.ui.subscriptions.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <CreditCard className="h-8 w-8" />
          <h1 className="text-primary text-3xl font-semibold">{t("billing.ui.subscriptions.title")}</h1>
        </div>
        {subscriptions.length > 0 && (
          <Button onClick={() => onOpenWizard?.()}>
            {hasActiveRecurringSubscription
              ? t("billing.ui.subscriptions.purchase_addons")
              : t("billing.ui.subscriptions.subscribe")}
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
            <h3 className="text-sm font-medium mb-2">{t("billing.ui.subscriptions.empty_title")}</h3>
            <p className="text-muted-foreground mb-6">{t("billing.ui.subscriptions.empty_description")}</p>
            <Button onClick={() => onOpenWizard?.()}>{t("billing.ui.subscriptions.subscribe")}</Button>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions.length > 0 && (
        <SubscriptionsList
          subscriptions={subscriptions}
          onSubscriptionsChange={loadSubscriptions}
          onChangePlan={(sub) => onOpenWizard?.(sub)}
          renderCancelDialog={renderCancelDialog}
        />
      )}
    </div>
  );
}
