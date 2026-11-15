"use client";

import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shadcnui";
import { formatCurrency, formatDate, useBillingFormatOptions } from "../../components/utils";
import { InvoiceDetails } from "../../stripe-invoice/components/details/InvoiceDetails";
import { InvoiceStatusBadge } from "../../stripe-invoice/components/widgets/InvoiceStatusBadge";
import { InvoiceStatus, StripeInvoiceInterface } from "../../stripe-invoice/data/stripe-invoice.interface";
import { StripeSubscriptionInterface } from "../../stripe-subscription/data/stripe-subscription.interface";
import { AdminPaymentRow, buildAdminPayments, totalsByCurrency } from "../utils/admin-payments";
import { AdminInvoiceStatusBadge } from "./AdminInvoiceStatusBadge";

type AdminCompanyPaymentsProps = {
  invoices: StripeInvoiceInterface[];
  /** Old one-time purchases that never produced an invoice. */
  purchases: StripeSubscriptionInterface[];
  loading?: boolean;
  error?: string;
};

export function AdminCompanyPayments({ invoices, purchases, loading, error }: AdminCompanyPaymentsProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const [selected, setSelected] = useState<StripeInvoiceInterface | undefined>(undefined);

  const rows = useMemo(() => buildAdminPayments(invoices, purchases), [invoices, purchases]);
  const totals = useMemo(() => totalsByCurrency(rows), [rows]);

  const forLabel = (row: AdminPaymentRow): string => {
    if (row.forKey === "unknown") return "—";
    if (row.forKey === "other" && !row.forName) return "—";
    return t(`billing.ui.admin_company.for.${row.forKey}`, { name: row.forName ?? "" });
  };

  const header = (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>{t("billing.ui.admin_company.payments.title")}</CardTitle>
      <Receipt className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
  );

  if (loading) {
    return (
      <Card data-testid="admin-company-payments">
        {header}
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="admin-company-payments">
        {header}
        <CardContent>
          <p className="text-destructive text-xs/relaxed" data-testid="admin-company-payments-error">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card data-testid="admin-company-payments">
        {header}
        <CardContent>
          <p className="text-sm text-muted-foreground" data-testid="admin-company-payments-empty">
            {t("billing.ui.admin_company.payments.empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalText = (totals.length > 0 ? totals : [{ currency: "eur", amount: 0 }])
    .map((total) => formatCurrency(total.amount, total.currency, fmt))
    .join(" · ");

  return (
    <Card data-testid="admin-company-payments">
      {header}
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("billing.ui.admin_company.payments.columns.date")}</TableHead>
              <TableHead>{t("billing.ui.admin_company.payments.columns.for")}</TableHead>
              <TableHead>{t("billing.ui.admin_company.payments.columns.status")}</TableHead>
              <TableHead className="text-end">{t("billing.ui.admin_company.payments.columns.amount")}</TableHead>
              <TableHead>{t("billing.ui.admin_company.payments.columns.period")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const invoice = row.invoice;
              return (
                <TableRow
                  key={row.id}
                  data-testid="admin-company-payment-row"
                  data-payment-id={row.id}
                  data-clickable={invoice ? "true" : "false"}
                  className={invoice ? "cursor-pointer" : undefined}
                  onClick={invoice ? () => setSelected(invoice) : undefined}
                >
                  <TableCell data-testid="admin-company-payment-date">{formatDate(row.date, fmt)}</TableCell>
                  <TableCell data-testid="admin-company-payment-for">{forLabel(row)}</TableCell>
                  <TableCell data-testid="admin-company-payment-status">
                    {invoice ? (
                      <AdminInvoiceStatusBadge invoice={invoice} />
                    ) : (
                      <span data-status="paid">
                        <InvoiceStatusBadge status={InvoiceStatus.PAID} />
                      </span>
                    )}
                  </TableCell>
                  <TableCell data-testid="admin-company-payment-amount" className="text-xs tabular-nums text-end">
                    {row.amount !== undefined && row.currency ? formatCurrency(row.amount, row.currency, fmt) : "—"}
                  </TableCell>
                  <TableCell data-testid="admin-company-payment-period">
                    {row.periodStart && row.periodEnd
                      ? `${formatDate(row.periodStart, fmt)} – ${formatDate(row.periodEnd, fmt)}`
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-sm text-end tabular-nums" data-testid="admin-company-payments-total">
          {t("billing.ui.admin_company.payments.total_paid", { amounts: totalText })}
        </p>
      </CardContent>

      {selected && (
        <InvoiceDetails
          invoice={selected}
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(undefined);
          }}
          onInvoiceChange={() => {}}
          readOnly
        />
      )}
    </Card>
  );
}
