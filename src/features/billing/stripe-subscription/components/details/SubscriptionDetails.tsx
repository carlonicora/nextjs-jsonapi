"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../shadcnui";
import {
  type BillingFormatOptions,
  formatCurrency,
  formatDate,
  useBillingFormatOptions,
} from "../../../components/utils";
import { StripeCustomerService } from "../../../stripe-customer";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeSubscriptionInterface, SubscriptionStatus } from "../../data";
import { CancelSubscriptionDialog } from "../forms/CancelSubscriptionDialog";
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

/**
 * Formats the billing amount from price data.
 */
function formatBillingAmount(
  price: StripePriceInterface | undefined,
  notAvailable: string,
  fmt: BillingFormatOptions,
): string {
  if (!price?.unitAmount) return notAvailable;
  return formatCurrency(price.unitAmount, price.currency, fmt);
}

/** Props an app receives when it replaces the library cancel dialog. */
export type CancelDialogRenderProps = {
  subscription: StripeSubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Opens the plan-change wizard for this subscription and closes the details. Undefined when the host gave no onChangePlan. */
  openChangePlan?: () => void;
};

/** Optional replacement for the library cancel dialog. Absent, the library renders CancelSubscriptionDialog. */
export type RenderCancelDialog = (props: CancelDialogRenderProps) => ReactNode;

type SubscriptionDetailsProps = {
  subscription: StripeSubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionChange: () => void;
  onChangePlan?: (subscription: StripeSubscriptionInterface) => void;
  renderCancelDialog?: RenderCancelDialog;
};

export function SubscriptionDetails({
  subscription,
  open,
  onOpenChange,
  onSubscriptionChange,
  onChangePlan,
  renderCancelDialog,
}: SubscriptionDetailsProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const [showCancel, setShowCancel] = useState<boolean>(false);

  const handleManageViaPortal = async () => {
    try {
      const { url } = await StripeCustomerService.createPortalSession();
      window.open(url, "_blank");
    } catch (error) {
      console.error("[SubscriptionDetails] Failed to create portal session:", error);
    }
  };

  const canCancel =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIALING ||
    subscription.status === SubscriptionStatus.PAUSED;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("billing.ui.subscription.details_title")}</DialogTitle>
            <DialogDescription>{t("billing.ui.subscription.details_description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-x-3">
              <span className="text-muted-foreground text-xs">{t("billing.ui.labels.status")}</span>
              <SubscriptionStatusBadge
                status={subscription.status}
                cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
              />
            </div>

            {/* Plan Info */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">{t("billing.ui.labels.plan")}</span>
                <span className="text-sm">{formatPlanName(subscription.price, t)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">{t("billing.ui.subscription.billing_amount")}</span>
                <span className="text-sm">
                  {formatBillingAmount(subscription.price, t("billing.ui.not_available"), fmt)}
                </span>
              </div>
            </div>

            {/* Current Period */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">{t("billing.ui.subscription.current_period")}</span>
                <span className="text-sm">
                  {formatDate(subscription.currentPeriodStart, fmt)} - {formatDate(subscription.currentPeriodEnd, fmt)}
                </span>
              </div>
            </div>

            {/* Trial Info */}
            {subscription.trialEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">{t("billing.ui.subscription.trial_ends")}</span>
                <span className="text-sm">{formatDate(subscription.trialEnd, fmt)}</span>
              </div>
            )}

            {/* Cancellation Warning */}
            {subscription.cancelAtPeriodEnd && (
              <div className="bg-warning/15 border-warning/30 rounded-lg border p-3">
                <p className="text-warning text-xs/relaxed">
                  {t("billing.ui.subscription.cancel_at_period_end", {
                    date: formatDate(subscription.currentPeriodEnd, fmt),
                  })}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {onChangePlan && (
                <Button variant="default" onClick={() => onChangePlan(subscription)}>
                  {t("billing.ui.subscription.change_plan")}
                </Button>
              )}

              {canCancel && (
                <Button variant="destructive" onClick={() => setShowCancel(true)}>
                  {t("ui.buttons.cancel")}
                </Button>
              )}

              <Button variant="outline" onClick={handleManageViaPortal}>
                {t("billing.ui.subscription.manage_portal")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      {showCancel &&
        (renderCancelDialog ? (
          renderCancelDialog({
            subscription,
            open: showCancel,
            onOpenChange: setShowCancel,
            onSuccess: () => {
              onSubscriptionChange();
              setShowCancel(false);
            },
            openChangePlan: onChangePlan
              ? () => {
                  onChangePlan(subscription);
                  onOpenChange(false);
                }
              : undefined,
          })
        ) : (
          <CancelSubscriptionDialog
            subscription={subscription}
            open={showCancel}
            onOpenChange={setShowCancel}
            onSuccess={() => {
              onSubscriptionChange();
              setShowCancel(false);
            }}
          />
        ))}
    </>
  );
}
