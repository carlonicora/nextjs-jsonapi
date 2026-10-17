"use client";

import { useTranslations } from "next-intl";
import { Download, ExternalLink, RefreshCw } from "lucide-react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../shadcnui";
import { formatCurrency, formatDate, useBillingFormatOptions } from "../../../components/utils";
import { InvoiceStatus, StripeInvoiceInterface } from "../../data/stripe-invoice.interface";
import { InvoiceStatusBadge } from "../widgets/InvoiceStatusBadge";

type InvoiceDetailsProps = {
  invoice: StripeInvoiceInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceChange: () => void;
};

export function InvoiceDetails({
  invoice,
  open,
  onOpenChange,
  onInvoiceChange: _onInvoiceChange,
}: InvoiceDetailsProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const handleDownloadPDF = () => {
    if (invoice.stripePdfUrl) {
      window.open(invoice.stripePdfUrl, "_blank");
    }
  };

  const handleRetryPayment = async () => {
    // TODO: Implement retry payment logic
  };

  const handleViewInStripe = () => {
    if (invoice.stripeHostedInvoiceUrl) {
      window.open(invoice.stripeHostedInvoiceUrl, "_blank");
    }
  };

  const getInvoiceNumber = (): string => {
    if (invoice.stripeInvoiceNumber) {
      return invoice.stripeInvoiceNumber;
    }
    return invoice.stripeInvoiceId.slice(-8);
  };

  const productName = invoice.subscription?.price?.product?.name || t("billing.ui.cards.subscriptions.fallback_name");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("billing.ui.invoice.title", { number: getInvoiceNumber() })}</DialogTitle>
          <DialogDescription>{formatDate(invoice.periodStart, fmt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-x-3">
            <span className="text-sm font-medium text-muted-foreground">{t("billing.ui.labels.status")}</span>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          {/* Invoice Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground text-xs">{t("billing.ui.invoice.billing_period")}</span>
              <p className="text-sm">
                {formatDate(invoice.periodStart, fmt)} - {formatDate(invoice.periodEnd, fmt)}
              </p>
            </div>

            {invoice.dueDate && (
              <div>
                <span className="text-muted-foreground text-xs">{t("billing.ui.invoice.due_date")}</span>
                <p className="text-sm">{formatDate(invoice.dueDate, fmt)}</p>
              </div>
            )}

            {invoice.paidAt && (
              <div>
                <span className="text-muted-foreground text-xs">{t("billing.ui.invoice.paid_date")}</span>
                <p className="text-sm">{formatDate(invoice.paidAt, fmt)}</p>
              </div>
            )}

            <div>
              <span className="text-muted-foreground text-xs">{t("billing.ui.invoice.attempt_count")}</span>
              <p className="text-sm">{invoice.attemptCount}</p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t("billing.ui.invoice.line_items")}</h4>
            <div className="border rounded-lg overflow-clip">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-start p-3 text-sm font-medium">{t("billing.ui.columns.description")}</th>
                    <th className="text-end p-3 text-sm font-medium">{t("billing.ui.columns.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">{productName}</td>
                    <td className="p-3 text-end">{formatCurrency(invoice.subtotal, invoice.currency, fmt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs">{t("billing.ui.invoice.subtotal")}</span>
              <span className="text-sm">{formatCurrency(invoice.subtotal, invoice.currency, fmt)}</span>
            </div>

            {invoice.tax !== undefined && invoice.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">{t("billing.ui.invoice.tax")}</span>
                <span className="text-sm">{formatCurrency(invoice.tax, invoice.currency, fmt)}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>{t("billing.ui.invoice.total")}</span>
              <span>{formatCurrency(invoice.total, invoice.currency, fmt)}</span>
            </div>

            {invoice.amountPaid > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">{t("billing.ui.invoice.amount_paid")}</span>
                <span className="text-sm text-success">
                  {formatCurrency(invoice.amountPaid, invoice.currency, fmt)}
                </span>
              </div>
            )}

            {invoice.amountRemaining > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">{t("billing.ui.invoice.amount_due")}</span>
                <span className="text-sm text-destructive">
                  {formatCurrency(invoice.amountRemaining, invoice.currency, fmt)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {invoice.stripePdfUrl && (
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="me-2 h-4 w-4" />
                {t("billing.ui.invoice.download_pdf")}
              </Button>
            )}

            {invoice.status === InvoiceStatus.OPEN && invoice.attempted && (
              <Button variant="default" onClick={handleRetryPayment}>
                <RefreshCw className="me-2 h-4 w-4" />
                {t("billing.ui.invoice.retry_payment")}
              </Button>
            )}

            {invoice.stripeHostedInvoiceUrl && (
              <Button variant="outline" onClick={handleViewInStripe}>
                <ExternalLink className="me-2 h-4 w-4" />
                {t("billing.ui.invoice.view_in_stripe")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
