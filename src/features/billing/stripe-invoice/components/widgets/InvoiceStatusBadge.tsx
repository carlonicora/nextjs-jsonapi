"use client";

import { useTranslations } from "next-intl";
import { Badge, type BadgeProps } from "../../../../../shadcnui";
import { InvoiceStatus } from "../../data/stripe-invoice.interface";

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

type StatusConfig = {
  /** Message key, translated at render time. */
  label: string;
  variant: BadgeProps["variant"];
};

const statusConfig: Record<InvoiceStatus, StatusConfig> = {
  [InvoiceStatus.DRAFT]: {
    label: "billing.ui.invoice_status.draft",
    variant: "softGray",
  },
  [InvoiceStatus.OPEN]: {
    label: "billing.ui.invoice_status.open",
    variant: "softBlue",
  },
  [InvoiceStatus.PAID]: {
    label: "billing.ui.invoice_status.paid",
    variant: "softGreen",
  },
  [InvoiceStatus.VOID]: {
    label: "billing.ui.invoice_status.void",
    variant: "softGray",
  },
  [InvoiceStatus.UNCOLLECTIBLE]: {
    label: "billing.ui.invoice_status.uncollectible",
    variant: "softRed",
  },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const t = useTranslations();
  const config = statusConfig[status] || statusConfig[InvoiceStatus.DRAFT];

  return <Badge variant={config.variant}>{t(config.label)}</Badge>;
}
