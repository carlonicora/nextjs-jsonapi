"use client";

import { Badge, type BadgeProps } from "../../../../../shadcnui";
import { InvoiceStatus } from "../../data/stripe-invoice.interface";

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

type StatusConfig = {
  label: string;
  variant: BadgeProps["variant"];
};

const statusConfig: Record<InvoiceStatus, StatusConfig> = {
  [InvoiceStatus.DRAFT]: {
    label: "Draft",
    variant: "softGray",
  },
  [InvoiceStatus.OPEN]: {
    label: "Open",
    variant: "softBlue",
  },
  [InvoiceStatus.PAID]: {
    label: "Paid",
    variant: "softGreen",
  },
  [InvoiceStatus.VOID]: {
    label: "Void",
    variant: "softGray",
  },
  [InvoiceStatus.UNCOLLECTIBLE]: {
    label: "Uncollectible",
    variant: "softRed",
  },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[InvoiceStatus.DRAFT];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
