"use client";

import { useTranslations } from "next-intl";
import { ProrationPreviewInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { formatCurrency, useBillingFormatOptions } from "../../../components/utils";

type ProrationPreviewProps = {
  preview: ProrationPreviewInterface;
};

export function ProrationPreview({ preview }: ProrationPreviewProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  return (
    <div className="bg-primary/10 border-primary/30 rounded-lg border p-4">
      <h4 className="text-primary mb-3 font-semibold">{t("billing.ui.proration.title")}</h4>

      <div className="space-y-2">
        {preview.lineItems.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.description}</span>
            <span className={`font-medium ${item.amount < 0 ? "text-success" : "text-foreground"}`}>
              {formatCurrency(item.amount, preview.currency, fmt)}
            </span>
          </div>
        ))}

        <div className="border-primary/30 mt-2 border-t pt-2">
          <div className="flex justify-between font-semibold">
            <span className="text-foreground">{t("billing.ui.proration.net_due_today")}</span>
            <span className="text-foreground">{formatCurrency(preview.immediateCharge, preview.currency, fmt)}</span>
          </div>
        </div>

        {preview.lineItems.length > 0 && preview.lineItems[0].period && (
          <div className="text-muted-foreground mt-2 text-xs">
            {t("billing.ui.proration.next_invoice", {
              amount: formatCurrency(preview.amountDue, preview.currency, fmt),
            })}
          </div>
        )}
      </div>
    </div>
  );
}
