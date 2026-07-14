"use client";

import { Badge, type BadgeProps } from "../../../../../shadcnui";
import { SubscriptionStatus } from "../../data";

type SubscriptionStatusBadgeProps = {
  status: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
};

type StatusConfig = {
  label: string;
  variant: BadgeProps["variant"];
};

const statusConfig: Record<SubscriptionStatus, StatusConfig> = {
  [SubscriptionStatus.ACTIVE]: {
    label: "Active",
    variant: "softGreen",
  },
  [SubscriptionStatus.TRIALING]: {
    label: "Trial",
    variant: "softBlue",
  },
  [SubscriptionStatus.PAST_DUE]: {
    label: "Past Due",
    variant: "softRed",
  },
  [SubscriptionStatus.CANCELED]: {
    label: "Canceled",
    variant: "softGray",
  },
  [SubscriptionStatus.PAUSED]: {
    label: "Paused",
    variant: "softYellow",
  },
  [SubscriptionStatus.UNPAID]: {
    label: "Unpaid",
    variant: "softOrange",
  },
  [SubscriptionStatus.INCOMPLETE]: {
    label: "Incomplete",
    variant: "softGray",
  },
  [SubscriptionStatus.INCOMPLETE_EXPIRED]: {
    label: "Expired",
    variant: "softGray",
  },
};

const cancelingConfig: StatusConfig = {
  label: "Canceling",
  variant: "softAmber",
};

export function SubscriptionStatusBadge({ status, cancelAtPeriodEnd }: SubscriptionStatusBadgeProps) {
  // Show "Canceling" when subscription is set to cancel at period end
  const config = cancelAtPeriodEnd
    ? cancelingConfig
    : statusConfig[status] || statusConfig[SubscriptionStatus.CANCELED];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
