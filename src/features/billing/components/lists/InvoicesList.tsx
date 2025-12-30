"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shadcnui";
import { InvoiceInterface } from "../../data/invoice.interface";
import { InvoiceDetails } from "../details/InvoiceDetails";
import { formatCurrency, formatDate } from "../utils";
import { InvoiceStatusBadge } from "../widgets/InvoiceStatusBadge";

type InvoicesListProps = {
  invoices: InvoiceInterface[];
  onInvoicesChange: () => void;
};

export function InvoicesList({ invoices, onInvoicesChange }: InvoicesListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInterface | null>(null);

  const handleRowClick = (invoice: InvoiceInterface) => {
    console.log("[InvoicesList] Opening invoice details:", invoice.id);
    setSelectedInvoice(invoice);
  };

  const getInvoiceNumber = (invoice: InvoiceInterface): string => {
    if (invoice.stripeInvoiceNumber) {
      return invoice.stripeInvoiceNumber;
    }
    // Use last 8 characters of stripeInvoiceId as fallback
    return invoice.stripeInvoiceId.slice(-8);
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Period</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const invoiceNumber = getInvoiceNumber(invoice);
              const date = formatDate(invoice.periodStart);
              const amount = formatCurrency(invoice.total, invoice.currency);
              const period = `${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}`;

              return (
                <TableRow
                  key={invoice.id}
                  onClick={() => handleRowClick(invoice)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{date}</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">{amount}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{period}</TableCell>
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
