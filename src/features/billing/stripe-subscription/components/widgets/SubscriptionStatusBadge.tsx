"use client";

import { SubscriptionStatus } from "../../data";

type SubscriptionStatusBadgeProps = {
  status: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
};

type StatusConfig = {
  label: string;
  color: string;
};

const statusConfig: Record<SubscriptionStatus, StatusConfig> = {
  [SubscriptionStatus.ACTIVE]: {
    label: "Active",
    color: "bg-green-100 text-green-800",
  },
  [SubscriptionStatus.TRIALING]: {
    label: "Trial",
    color: "bg-blue-100 text-blue-800",
  },
  [SubscriptionStatus.PAST_DUE]: {
    label: "Past Due",
    color: "bg-red-100 text-red-800",
  },
  [SubscriptionStatus.CANCELED]: {
    label: "Canceled",
    color: "bg-gray-100 text-gray-800",
  },
  [SubscriptionStatus.PAUSED]: {
    label: "Paused",
    color: "bg-yellow-100 text-yellow-800",
  },
  [SubscriptionStatus.UNPAID]: {
    label: "Unpaid",
    color: "bg-orange-100 text-orange-800",
  },
  [SubscriptionStatus.INCOMPLETE]: {
    label: "Incomplete",
    color: "bg-gray-100 text-gray-800",
  },
  [SubscriptionStatus.INCOMPLETE_EXPIRED]: {
    label: "Expired",
    color: "bg-gray-100 text-gray-800",
  },
};

const cancelingConfig: StatusConfig = {
  label: "Canceling",
  color: "bg-amber-100 text-amber-800",
};

export function SubscriptionStatusBadge({ status, cancelAtPeriodEnd }: SubscriptionStatusBadgeProps) {
  // Show "Canceling" when subscription is set to cancel at period end
  const config = cancelAtPeriodEnd ? cancelingConfig : statusConfig[status] || statusConfig[SubscriptionStatus.CANCELED];

  return <span className={`${config.color} text-xs px-2 py-1 rounded-full font-medium`}>{config.label}</span>;
}
