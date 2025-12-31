"use client";

import { ProrationPreviewInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { formatCurrency, formatDate } from "../../../components/utils";

type ProrationPreviewProps = {
  preview: ProrationPreviewInterface;
};

export function ProrationPreview({ preview }: ProrationPreviewProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-3">Proration Breakdown</h4>

      <div className="space-y-2">
        {preview.lineItems.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-blue-800">{item.description}</span>
            <span className={`font-medium ${item.amount < 0 ? "text-green-600" : "text-blue-900"}`}>
              {formatCurrency(item.amount, preview.currency)}
            </span>
          </div>
        ))}

        <div className="border-t border-blue-200 pt-2 mt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-blue-900">Net Due Today</span>
            <span className="text-blue-900">{formatCurrency(preview.immediateCharge, preview.currency)}</span>
          </div>
        </div>

        {preview.lineItems.length > 0 && preview.lineItems[0].period && (
          <div className="text-xs text-blue-700 mt-2">
            Next invoice on {formatDate(preview.lineItems[0].period.end)} for{" "}
            {formatCurrency(preview.amountDue, preview.currency)}
          </div>
        )}
      </div>
    </div>
  );
}
