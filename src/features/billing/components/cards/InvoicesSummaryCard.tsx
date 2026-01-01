"use client";

import { ReceiptIcon, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from "../../../../shadcnui";
import {
  StripeInvoiceInterface,
  InvoiceStatus,
} from "../../stripe-invoice";

type InvoicesSummaryCardProps = {
  invoices: StripeInvoiceInterface[];
  loading?: boolean;
  error?: string;
  onViewAllClick: () => void;
};

function getStatusBadgeVariant(
  status: InvoiceStatus
): "default" | "secondary" | "destructive" | "outline" {
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number, currency: string): string {
  const currencyCode = currency?.toUpperCase() || "USD";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100);
}

export function InvoicesSummaryCard({
  invoices,
  loading,
  error,
  onViewAllClick,
}: InvoicesSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
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
          <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
          <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Get the most recent invoice
  const latestInvoice = invoices[0];
  const paidInvoices = invoices.filter((inv) => inv.status === InvoiceStatus.PAID);
  const openInvoices = invoices.filter((inv) => inv.status === InvoiceStatus.OPEN);

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onViewAllClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
        <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">No invoices yet</p>
            <p className="text-xs text-muted-foreground">
              Invoices will appear after your first billing cycle
            </p>
          </div>
        ) : latestInvoice ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">
                {formatAmount(latestInvoice.total, latestInvoice.currency)}
              </p>
              <Badge variant={getStatusBadgeVariant(latestInvoice.status)}>
                {latestInvoice.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {latestInvoice.stripeInvoiceNumber || `Invoice from ${formatDate(latestInvoice.periodStart)}`}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {paidInvoices.length > 0 && (
                <span>{paidInvoices.length} paid</span>
              )}
              {openInvoices.length > 0 && (
                <span className="text-orange-600">{openInvoices.length} open</span>
              )}
              <span className="flex items-center">
                View all
                <ChevronRight className="h-3 w-3 ml-1" />
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
