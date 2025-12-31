"use client";

import { InvoiceStatus } from "../../data/stripe-invoice.interface";

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

type StatusConfig = {
  label: string;
  color: string;
};

const statusConfig: Record<InvoiceStatus, StatusConfig> = {
  [InvoiceStatus.DRAFT]: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800",
  },
  [InvoiceStatus.OPEN]: {
    label: "Open",
    color: "bg-blue-100 text-blue-800",
  },
  [InvoiceStatus.PAID]: {
    label: "Paid",
    color: "bg-green-100 text-green-800",
  },
  [InvoiceStatus.VOID]: {
    label: "Void",
    color: "bg-gray-100 text-gray-800",
  },
  [InvoiceStatus.UNCOLLECTIBLE]: {
    label: "Uncollectible",
    color: "bg-red-100 text-red-800",
  },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[InvoiceStatus.DRAFT];

  return <span className={`${config.color} text-xs px-2 py-1 rounded-full font-medium`}>{config.label}</span>;
}
