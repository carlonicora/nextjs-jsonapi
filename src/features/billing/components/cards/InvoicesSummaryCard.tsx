"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, ReceiptIcon } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from "../../../../shadcnui";
import { InvoiceStatus, StripeInvoiceInterface } from "../../stripe-invoice";
import { formatDate, useBillingFormatOptions } from "../utils";

type InvoicesSummaryCardProps = {
  invoices: StripeInvoiceInterface[];
  loading?: boolean;
  error?: string;
  onViewAllClick: () => void;
};

/** Statuses with a `billing.ui.invoice_status.*` label; anything else Stripe adds is shown raw. */
const INVOICE_STATUSES: string[] = Object.values(InvoiceStatus);

function getStatusBadgeVariant(status: InvoiceStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case InvoiceStatus.PAID:
      return "default";
    case InvoiceStatus.OPEN:
      return "secondary";
    case InvoiceStatus.UNCOLLECTIBLE:
    case InvoiceStatus.VOID:
      return "destructive";
    default:
      return "outline";
  }
}

function formatAmount(amount: number, currency: string, locale: string): string {
  const currencyCode = currency?.toUpperCase() || "USD";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100);
}

export function InvoicesSummaryCard({ invoices, loading, error, onViewAllClick }: InvoicesSummaryCardProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t("billing.ui.cards.invoices.title")}</CardTitle>
          <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t("billing.ui.cards.invoices.title")}</CardTitle>
          <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-xs/relaxed">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // The most recent invoice that could charge something: a void one is an unpaid first-payment
  // attempt that was replaced, which never charged the GM (fall back to it only when nothing else exists)
  const latestInvoice = invoices.find((inv) => inv.status !== InvoiceStatus.VOID) ?? invoices[0];
  const paidInvoices = invoices.filter((inv) => inv.status === InvoiceStatus.PAID);
  const openInvoices = invoices.filter((inv) => inv.status === InvoiceStatus.OPEN);

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onViewAllClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{t("billing.ui.cards.invoices.title")}</CardTitle>
        <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">{t("billing.ui.invoices.empty_title")}</p>
            <p className="text-xs text-muted-foreground">{t("billing.ui.cards.invoices.empty_description")}</p>
          </div>
        ) : latestInvoice ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">
                {formatAmount(latestInvoice.total, latestInvoice.currency, fmt.locale)}
              </p>
              <Badge variant={getStatusBadgeVariant(latestInvoice.status)}>
                {INVOICE_STATUSES.includes(latestInvoice.status)
                  ? t(`billing.ui.invoice_status.${latestInvoice.status}`)
                  : latestInvoice.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {latestInvoice.stripeInvoiceNumber ||
                t("billing.ui.cards.invoices.invoice_from", { date: formatDate(latestInvoice.periodStart, fmt) })}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {paidInvoices.length > 0 && (
                <span>{t("billing.ui.cards.invoices.paid_count", { count: paidInvoices.length })}</span>
              )}
              {openInvoices.length > 0 && (
                <span className="text-warning">
                  {t("billing.ui.cards.invoices.open_count", { count: openInvoices.length })}
                </span>
              )}
              <span className="flex items-center">
                {t("billing.ui.cards.view_all")}
                <ChevronRight className="h-3 w-3 ms-1 rtl:rotate-180" />
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
