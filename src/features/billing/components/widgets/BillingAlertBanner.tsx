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
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Payment Failed</h3>
          <p className="text-sm text-red-700 mt-1">
            Your last payment failed. Please update your payment method to avoid service interruption.
          </p>
        </div>
        {onUpdatePayment && (
          <Button variant="outline" size="sm" onClick={onUpdatePayment} className="border-red-300 text-red-700">
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
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">Trial Ending Soon</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your trial ends in {daysRemaining} {daysRemaining === 1 ? "day" : "days"}. Add a payment method to
              continue your subscription.
            </p>
          </div>
          {onAddPayment && (
            <Button variant="outline" size="sm" onClick={onAddPayment} className="border-yellow-300 text-yellow-700">
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
