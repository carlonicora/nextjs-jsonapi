"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../shadcnui";
import { formatCurrency, formatDate, useBillingFormatOptions } from "../../../components/utils";
import { StripeInvoiceInterface } from "../../data/stripe-invoice.interface";
import { InvoiceDetails } from "../details/InvoiceDetails";
import { InvoiceStatusBadge } from "../widgets/InvoiceStatusBadge";

type InvoicesListProps = {
  invoices: StripeInvoiceInterface[];
  onInvoicesChange: () => void;
};

export function InvoicesList({ invoices, onInvoicesChange }: InvoicesListProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const [selectedInvoice, setSelectedInvoice] = useState<StripeInvoiceInterface | null>(null);

  const handleRowClick = (invoice: StripeInvoiceInterface) => {
    setSelectedInvoice(invoice);
  };

  const getInvoiceNumber = (invoice: StripeInvoiceInterface): string => {
    if (invoice.stripeInvoiceNumber) {
      return invoice.stripeInvoiceNumber;
    }
    // Use last 8 characters of stripeInvoiceId as fallback
    return invoice.stripeInvoiceId.slice(-8);
  };

  return (
    <>
      <div className="border rounded-lg overflow-clip">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>{t("billing.ui.columns.invoice_number")}</TableHead>
              <TableHead>{t("billing.ui.columns.date")}</TableHead>
              <TableHead>{t("billing.ui.columns.status")}</TableHead>
              <TableHead className="text-end">{t("billing.ui.columns.amount")}</TableHead>
              <TableHead>{t("billing.ui.columns.period")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const invoiceNumber = getInvoiceNumber(invoice);
              const date = formatDate(invoice.periodStart, fmt);
              const amount = formatCurrency(invoice.total, invoice.currency, fmt);
              const period = `${formatDate(invoice.periodStart, fmt)} - ${formatDate(invoice.periodEnd, fmt)}`;

              return (
                <TableRow
                  key={invoice.id}
                  onClick={() => handleRowClick(invoice)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{date}</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-end font-medium">{amount}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{period}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Details Dialog */}
      {selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
          onInvoiceChange={() => {
            onInvoicesChange();
            setSelectedInvoice(null);
          }}
        />
      )}
    </>
  );
}
