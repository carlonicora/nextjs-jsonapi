"use client";

import { ProrationPreviewInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { formatCurrency, formatDate } from "../../../components/utils";

type ProrationPreviewProps = {
  preview: ProrationPreviewInterface;
};

export function ProrationPreview({ preview }: ProrationPreviewProps) {
  return (
    <div className="bg-primary/10 border-primary/30 rounded-lg border p-4">
      <h4 className="text-primary mb-3 font-semibold">Proration Breakdown</h4>

      <div className="space-y-2">
        {preview.lineItems.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.description}</span>
            <span className={`font-medium ${item.amount < 0 ? "text-success" : "text-foreground"}`}>
              {formatCurrency(item.amount, preview.currency)}
            </span>
          </div>
        ))}

        <div className="border-primary/30 mt-2 border-t pt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-foreground">Net Due Today</span>
            <span className="text-foreground">{formatCurrency(preview.immediateCharge, preview.currency)}</span>
          </div>
        </div>

        {preview.lineItems.length > 0 && preview.lineItems[0].period && (
          <div className="text-muted-foreground mt-2 text-xs">
            Next invoice on {formatDate(preview.lineItems[0].period.end)} for{" "}
            {formatCurrency(preview.amountDue, preview.currency)}
          </div>
        )}
      </div>
    </div>
  );
}
