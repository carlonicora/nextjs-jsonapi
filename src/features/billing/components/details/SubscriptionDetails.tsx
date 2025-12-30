"use client";

import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../shadcnui";
import { BillingService } from "../../data/billing.service";
import { SubscriptionInterface, SubscriptionStatus } from "../../data/subscription.interface";
import { StripeBillingCustomerService } from "../../stripe-billing-customer";
import { CancelSubscriptionDialog } from "../forms/CancelSubscriptionDialog";
import { SubscriptionEditor } from "../forms/SubscriptionEditor";
import { formatDate } from "../utils";
import { SubscriptionStatusBadge } from "../widgets/SubscriptionStatusBadge";

type SubscriptionDetailsProps = {
  subscription: SubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionChange: () => void;
};

export function SubscriptionDetails({
  subscription,
  open,
  onOpenChange,
  onSubscriptionChange,
}: SubscriptionDetailsProps) {
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [showCancel, setShowCancel] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handlePause = async () => {
    console.log("[SubscriptionDetails] Pausing subscription:", subscription.id);
    setIsProcessing(true);
    try {
      await BillingService.pauseSubscription({ subscriptionId: subscription.id });
      console.log("[SubscriptionDetails] Subscription paused successfully");
      onSubscriptionChange();
    } catch (error) {
      console.error("[SubscriptionDetails] Failed to pause subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResume = async () => {
    console.log("[SubscriptionDetails] Resuming subscription:", subscription.id);
    setIsProcessing(true);
    try {
      await BillingService.resumeSubscription({ subscriptionId: subscription.id });
      console.log("[SubscriptionDetails] Subscription resumed successfully");
      onSubscriptionChange();
    } catch (error) {
      console.error("[SubscriptionDetails] Failed to resume subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageViaPortal = async () => {
    console.log("[SubscriptionDetails] Opening Stripe portal...");
    try {
      const { url } = await StripeBillingCustomerService.createPortalSession();
      console.log("[SubscriptionDetails] Portal URL:", url);
      window.open(url, "_blank");
    } catch (error) {
      console.error("[SubscriptionDetails] Failed to create portal session:", error);
    }
  };

  const firstItem = subscription.items?.[0];
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
              <SubscriptionStatusBadge status={subscription.status} />
            </div>

            {/* Plan Info */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Plan:</span>
                <span className="font-medium">{firstItem?.priceId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Billing Amount:</span>
                <span className="font-medium">N/A</span>
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
              <Button variant="default" onClick={() => setShowEdit(true)}>
                Change Plan
              </Button>

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

      {/* Edit Subscription Dialog */}
      {showEdit && (
        <SubscriptionEditor
          subscription={subscription}
          open={showEdit}
          onOpenChange={setShowEdit}
          onSuccess={() => {
            onSubscriptionChange();
            setShowEdit(false);
          }}
        />
      )}

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
