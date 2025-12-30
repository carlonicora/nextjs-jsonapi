"use client";

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../shadcnui";
import { InvoiceInterface, InvoiceStatus } from "../../data/invoice.interface";
import { formatCurrency, formatDate } from "../utils";
import { InvoiceStatusBadge } from "../widgets/InvoiceStatusBadge";
import { Download, RefreshCw, ExternalLink } from "lucide-react";

type InvoiceDetailsProps = {
  invoice: InvoiceInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceChange: () => void;
};

export function InvoiceDetails({ invoice, open, onOpenChange, onInvoiceChange }: InvoiceDetailsProps) {
  const handleDownloadPDF = () => {
    console.log("[InvoiceDetails] Downloading PDF:", invoice.stripePdfUrl);
    if (invoice.stripePdfUrl) {
      window.open(invoice.stripePdfUrl, "_blank");
    }
  };

  const handleRetryPayment = async () => {
    console.log("[InvoiceDetails] Retry payment functionality not yet implemented");
    // TODO: Implement retry payment logic
  };

  const handleViewInStripe = () => {
    console.log("[InvoiceDetails] Opening Stripe hosted invoice:", invoice.stripeHostedInvoiceUrl);
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

  const productName = invoice.subscription?.price?.product?.name || "Subscription";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice {getInvoiceNumber()}</DialogTitle>
          <DialogDescription>
            {formatDate(invoice.periodStart)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-x-3">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          {/* Invoice Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Billing Period:</span>
              <p className="font-medium">
                {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
              </p>
            </div>

            {invoice.dueDate && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
            )}

            {invoice.paidAt && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Paid Date:</span>
                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-muted-foreground">Attempt Count:</span>
              <p className="font-medium">{invoice.attemptCount}</p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Line Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Description</th>
                    <th className="text-right p-3 text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">{productName}</td>
                    <td className="p-3 text-right">{formatCurrency(invoice.subtotal, invoice.currency)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>

            {invoice.tax !== undefined && invoice.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Tax:</span>
                <span className="font-medium">{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>

            {invoice.amountPaid > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Amount Paid:</span>
                <span className="font-medium text-green-600">{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
              </div>
            )}

            {invoice.amountRemaining > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Amount Due:</span>
                <span className="font-medium text-red-600">{formatCurrency(invoice.amountRemaining, invoice.currency)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {invoice.stripePdfUrl && (
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}

            {invoice.status === InvoiceStatus.OPEN && invoice.attempted && (
              <Button variant="default" onClick={handleRetryPayment}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
            )}

            {invoice.stripeHostedInvoiceUrl && (
              <Button variant="outline" onClick={handleViewInStripe}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View in Stripe
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
