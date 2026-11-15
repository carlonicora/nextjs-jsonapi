"use client";

import { useTranslations } from "next-intl";
import { Badge } from "../../../../shadcnui";
import { StripeInvoiceInterface } from "../../stripe-invoice/data/stripe-invoice.interface";
import { InvoiceStatusBadge } from "../../stripe-invoice/components/widgets/InvoiceStatusBadge";
import { isFailedInvoice } from "../utils/admin-payments";

/** The invoice status, or Failed when an open / uncollectible invoice was already charged. */
export function AdminInvoiceStatusBadge({ invoice }: { invoice: StripeInvoiceInterface }) {
  const t = useTranslations();
  const failed = isFailedInvoice(invoice);

  return (
    <span data-status={failed ? "failed" : invoice.status}>
      {failed ? (
        <Badge variant="softRed">{t("billing.ui.admin_company.invoice_status.failed")}</Badge>
      ) : (
        <InvoiceStatusBadge status={invoice.status} />
      )}
    </span>
  );
}
