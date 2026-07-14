"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "../../../../shadcnui";
import { StripeSubscriptionInterface, SubscriptionStatus } from "../../stripe-subscription";

type BillingAlertBannerProps = {
  subscription: StripeSubscriptionInterface;
  onUpdatePayment?: () => void;
  onAddPayment?: () => void;
};

export function BillingAlertBanner({ subscription, onUpdatePayment, onAddPayment }: BillingAlertBannerProps) {
  // Payment failed alert (past_due)
  if (subscription.status === SubscriptionStatus.PAST_DUE) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-x-3">
        <AlertCircle className="text-destructive mt-0.5 h-5 w-5" />
        <div className="flex-1">
          <h3 className="text-destructive text-sm font-medium">Payment Failed</h3>
          <p className="text-destructive mt-1 text-sm">
            Your last payment failed. Please update your payment method to avoid service interruption.
          </p>
        </div>
        {onUpdatePayment && (
          <Button variant="outline" size="sm" onClick={onUpdatePayment} className="text-destructive border-red-300">
            Update Payment Method
          </Button>
        )}
      </div>
    );
  }

  // Trial ending soon alert (trialing with ≤7 days remaining)
  if (subscription.status === SubscriptionStatus.TRIALING && subscription.trialEnd) {
    const trialEnd = new Date(subscription.trialEnd);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 7) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-x-3">
          <AlertCircle className="text-warning mt-0.5 h-5 w-5" />
          <div className="flex-1">
            <h3 className="text-warning text-sm font-medium">Trial Ending Soon</h3>
            <p className="text-warning mt-1 text-sm">
              Your trial ends in {daysRemaining} {daysRemaining === 1 ? "day" : "days"}. Add a payment method to
              continue your subscription.
            </p>
          </div>
          {onAddPayment && (
            <Button variant="outline" size="sm" onClick={onAddPayment} className="text-warning border-yellow-300">
              Add Payment Method
            </Button>
          )}
        </div>
      );
    }
  }

  // No critical state
  return null;
}
