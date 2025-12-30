"use client";

import { SubscriptionStatus } from "../../data";

type SubscriptionStatusBadgeProps = {
  status: SubscriptionStatus;
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

export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[SubscriptionStatus.CANCELED];

  return <span className={`${config.color} text-xs px-2 py-1 rounded-full font-medium`}>{config.label}</span>;
}
