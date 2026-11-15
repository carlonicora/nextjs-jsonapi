"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { registerTableGenerator } from "../../../../hooks/useTableGenerator";
import { TableContent, UseTableStructureHook } from "../../../../hooks/types";
import { formatCurrency, formatDate, useBillingFormatOptions } from "../../components/utils";
import { InvoiceStatusBadge } from "../../stripe-invoice/components/widgets/InvoiceStatusBadge";
import { InvoiceStatus, StripeInvoiceInterface } from "../../stripe-invoice/data/stripe-invoice.interface";
import { AdminInvoiceStatusBadge } from "../components/AdminInvoiceStatusBadge";
import { AdminPaymentRow } from "../utils/admin-payments";

/** Registry key of the admin company Payments table (see `AdminCompanyPaymentsTab`). */
export const ADMIN_COMPANY_PAYMENTS_TABLE = "admin-company-payments";

export enum AdminPaymentFields {
  date = "date",
  for = "for",
  status = "status",
  amount = "amount",
  period = "period",
}

type Context = { onOpenInvoice?: (invoice: StripeInvoiceInterface) => void };

export const useAdminCompanyPaymentTableStructure: UseTableStructureHook<AdminPaymentRow, AdminPaymentFields> = (
  params,
) => {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const context = (params.context ?? {}) as Context;

  const tableData = useMemo(
    () =>
      params.data.map((row) => {
        const entry: TableContent<AdminPaymentRow> = { jsonApiData: row };
        entry.id = row.id;
        return entry;
      }),
    [params.data],
  );

  const forLabel = (row: AdminPaymentRow): string => {
    if (row.priceName) return row.priceName;
    if (row.forKey === "one_time") return t("billing.ui.admin_company.for.one_time");
    return "—";
  };

  const fieldColumnMap: Record<AdminPaymentFields, () => ColumnDef<TableContent<AdminPaymentRow>>> = {
    [AdminPaymentFields.date]: () => ({
      id: AdminPaymentFields.date,
      header: t("billing.ui.admin_company.payments.columns.date"),
      cell: ({ row }: { row: Row<TableContent<AdminPaymentRow>> }) => {
        const payment = row.original.jsonApiData;
        const label = formatDate(payment.date, fmt);
        const invoice = payment.invoice;
        if (!invoice) {
          return (
            <span data-testid="admin-company-payment-date" data-payment-id={payment.id} data-clickable="false">
              {label}
            </span>
          );
        }
        return (
          <button
            type="button"
            className="text-primary cursor-pointer font-medium"
            data-testid="admin-company-payment-date"
            data-payment-id={payment.id}
            data-clickable="true"
            onClick={() => context.onOpenInvoice?.(invoice)}
          >
            {label}
          </button>
        );
      },
      enableHiding: false,
    }),
    [AdminPaymentFields.for]: () => ({
      id: AdminPaymentFields.for,
      header: t("billing.ui.admin_company.payments.columns.for"),
      cell: ({ row }: { row: Row<TableContent<AdminPaymentRow>> }) => (
        <span data-testid="admin-company-payment-for">{forLabel(row.original.jsonApiData)}</span>
      ),
      enableHiding: false,
    }),
    [AdminPaymentFields.status]: () => ({
      id: AdminPaymentFields.status,
      header: t("billing.ui.admin_company.payments.columns.status"),
      cell: ({ row }: { row: Row<TableContent<AdminPaymentRow>> }) => {
        const invoice = row.original.jsonApiData.invoice;
        return (
          <span data-testid="admin-company-payment-status">
            {invoice ? (
              <AdminInvoiceStatusBadge invoice={invoice} />
            ) : (
              <span data-status="paid">
                <InvoiceStatusBadge status={InvoiceStatus.PAID} />
              </span>
            )}
          </span>
        );
      },
      enableHiding: false,
    }),
    [AdminPaymentFields.amount]: () => ({
      id: AdminPaymentFields.amount,
      header: t("billing.ui.admin_company.payments.columns.amount"),
      cell: ({ row }: { row: Row<TableContent<AdminPaymentRow>> }) => {
        const payment = row.original.jsonApiData;
        return (
          <span data-testid="admin-company-payment-amount" className="text-xs tabular-nums">
            {payment.amount !== undefined && payment.currency
              ? formatCurrency(payment.amount, payment.currency, fmt)
              : "—"}
          </span>
        );
      },
      enableHiding: false,
    }),
    [AdminPaymentFields.period]: () => ({
      id: AdminPaymentFields.period,
      header: t("billing.ui.admin_company.payments.columns.period"),
      cell: ({ row }: { row: Row<TableContent<AdminPaymentRow>> }) => {
        const payment = row.original.jsonApiData;
        return (
          <span data-testid="admin-company-payment-period">
            {payment.periodStart && payment.periodEnd
              ? `${formatDate(payment.periodStart, fmt)} – ${formatDate(payment.periodEnd, fmt)}`
              : "—"}
          </span>
        );
      },
      enableHiding: false,
    }),
  };

  const columns = useMemo(
    () => params.fields.map((field) => fieldColumnMap[field]?.()).filter((column) => column !== undefined),
    [params.fields, fieldColumnMap],
  );

  return useMemo(() => ({ data: tableData, columns }), [tableData, columns]);
};

registerTableGenerator(ADMIN_COMPANY_PAYMENTS_TABLE, useAdminCompanyPaymentTableStructure);
