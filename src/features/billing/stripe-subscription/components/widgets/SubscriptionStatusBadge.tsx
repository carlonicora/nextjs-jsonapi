"use client";

import { useTranslations } from "next-intl";
import { Badge, type BadgeProps } from "../../../../../shadcnui";
import { SubscriptionStatus } from "../../data";

type SubscriptionStatusBadgeProps = {
  status: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
};

type StatusConfig = {
  /** Message key, translated at render time. */
  label: string;
  variant: BadgeProps["variant"];
};

const statusConfig: Record<SubscriptionStatus, StatusConfig> = {
  [SubscriptionStatus.ACTIVE]: {
    label: "billing.ui.subscription_status.active",
    variant: "softGreen",
  },
  [SubscriptionStatus.TRIALING]: {
    label: "billing.ui.subscription_status.trialing",
    variant: "softBlue",
  },
  [SubscriptionStatus.PAST_DUE]: {
    label: "billing.ui.subscription_status.past_due",
    variant: "softRed",
  },
  [SubscriptionStatus.CANCELED]: {
    label: "billing.ui.subscription_status.canceled",
    variant: "softGray",
  },
  [SubscriptionStatus.PAUSED]: {
    label: "billing.ui.subscription_status.paused",
    variant: "softYellow",
  },
  [SubscriptionStatus.UNPAID]: {
    label: "billing.ui.subscription_status.unpaid",
    variant: "softOrange",
  },
  [SubscriptionStatus.INCOMPLETE]: {
    label: "billing.ui.subscription_status.incomplete",
    variant: "softGray",
  },
  [SubscriptionStatus.INCOMPLETE_EXPIRED]: {
    label: "billing.ui.subscription_status.incomplete_expired",
    variant: "softGray",
  },
};

const cancelingConfig: StatusConfig = {
  label: "billing.ui.cards.subscriptions.canceling",
  variant: "softAmber",
};

export function SubscriptionStatusBadge({ status, cancelAtPeriodEnd }: SubscriptionStatusBadgeProps) {
  const t = useTranslations();
  // Show "Canceling" when subscription is set to cancel at period end
  const config = cancelAtPeriodEnd
    ? cancelingConfig
    : statusConfig[status] || statusConfig[SubscriptionStatus.CANCELED];

  return <Badge variant={config.variant}>{t(config.label)}</Badge>;
}
