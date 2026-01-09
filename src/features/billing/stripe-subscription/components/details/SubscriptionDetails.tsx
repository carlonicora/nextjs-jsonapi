"use client";

import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../shadcnui";
import { formatCurrency, formatDate } from "../../../components/utils";
import { StripeCustomerService } from "../../../stripe-customer";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeSubscriptionInterface, StripeSubscriptionService, SubscriptionStatus } from "../../data";
import { CancelSubscriptionDialog } from "../forms/CancelSubscriptionDialog";
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

/**
 * Formats the billing amount from price data.
 */
function formatBillingAmount(price: StripePriceInterface | undefined): string {
  if (!price?.unitAmount) return "N/A";
  return formatCurrency(price.unitAmount, price.currency);
}

type SubscriptionDetailsProps = {
  subscription: StripeSubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionChange: () => void;
  onChangePlan?: (subscription: StripeSubscriptionInterface) => void;
};

export function SubscriptionDetails({
  subscription,
  open,
  onOpenChange,
  onSubscriptionChange,
  onChangePlan,
}: SubscriptionDetailsProps) {
  const [showCancel, setShowCancel] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handlePause = async () => {
    setIsProcessing(true);
    try {
      await StripeSubscriptionService.pauseSubscription({ subscriptionId: subscription.id });
      onSubscriptionChange();
    } catch (error) {
      console.error("[SubscriptionDetails] Failed to pause subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResume = async () => {
    setIsProcessing(true);
    try {
      await StripeSubscriptionService.resumeSubscription({ subscriptionId: subscription.id });
      onSubscriptionChange();
    } catch (error) {
      console.error("[SubscriptionDetails] Failed to resume subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageViaPortal = async () => {
    try {
      const { url } = await StripeCustomerService.createPortalSession();
      window.open(url, "_blank");
    } catch (error) {
      console.error("[SubscriptionDetails] Failed to create portal session:", error);
    }
  };

  const canPause = subscription.status === SubscriptionStatus.ACTIVE;
  const canResume = subscription.status === SubscriptionStatus.PAUSED;
  const canCancel =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIALING ||
    subscription.status === SubscriptionStatus.PAUSED;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>View and manage your subscription</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-x-3">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <SubscriptionStatusBadge status={subscription.status} cancelAtPeriodEnd={subscription.cancelAtPeriodEnd} />
            </div>

            {/* Plan Info */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Plan:</span>
                <span className="font-medium">{formatPlanName(subscription.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Billing Amount:</span>
                <span className="font-medium">{formatBillingAmount(subscription.price)}</span>
              </div>
            </div>

            {/* Current Period */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Current Period:</span>
                <span className="font-medium">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            </div>

            {/* Trial Info */}
            {subscription.trialEnd && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Trial Ends:</span>
                <span className="font-medium">{formatDate(subscription.trialEnd)}</span>
              </div>
            )}

            {/* Cancellation Warning */}
            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  This subscription will be canceled at the end of the current period on{" "}
                  {formatDate(subscription.currentPeriodEnd)}.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {onChangePlan && (
                <Button variant="default" onClick={() => onChangePlan(subscription)}>
                  Change Plan
                </Button>
              )}

              {canPause && (
                <Button variant="outline" onClick={handlePause} disabled={isProcessing}>
                  {isProcessing ? "Pausing..." : "Pause"}
                </Button>
              )}

              {canResume && (
                <Button variant="outline" onClick={handleResume} disabled={isProcessing}>
                  {isProcessing ? "Resuming..." : "Resume"}
                </Button>
              )}

              {canCancel && (
                <Button variant="destructive" onClick={() => setShowCancel(true)}>
                  Cancel
                </Button>
              )}

              <Button variant="outline" onClick={handleManageViaPortal}>
                Manage via Portal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      {showCancel && (
        <CancelSubscriptionDialog
          subscription={subscription}
          open={showCancel}
          onOpenChange={setShowCancel}
          onSuccess={() => {
            onSubscriptionChange();
            setShowCancel(false);
          }}
        />
      )}
    </>
  );
}
