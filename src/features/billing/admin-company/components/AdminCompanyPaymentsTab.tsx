"use client";

import { useTranslations } from "next-intl";
import { Suspense, useMemo, useState } from "react";
import { ContentListTable } from "../../../../components/tables/ContentListTable";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks/useDataListRetriever";
import { ModuleWithPermissions } from "../../../../permissions";
import { Skeleton } from "../../../../shadcnui";
import { useCompanyContext } from "../../../company/contexts/CompanyContext";
import { formatCurrency, useBillingFormatOptions } from "../../components/utils";
import { InvoiceDetails } from "../../stripe-invoice/components/details/InvoiceDetails";
import { StripeInvoiceInterface } from "../../stripe-invoice/data/stripe-invoice.interface";
import { StripeInvoiceService } from "../../stripe-invoice/data/stripe-invoice.service";
import { StripeSubscriptionService } from "../../stripe-subscription/data/stripe-subscription.service";
import { ADMIN_COMPANY_PAYMENTS_TABLE, AdminPaymentFields } from "../hooks/useAdminCompanyPaymentTableStructure";
import { AdminPaymentRow, buildAdminPayments, totalsByCurrency } from "../utils/admin-payments";

const FIELDS = [
  AdminPaymentFields.date,
  AdminPaymentFields.for,
  AdminPaymentFields.status,
  AdminPaymentFields.amount,
  AdminPaymentFields.period,
];

/** Every payment of the company in the app's standard table: the Payments tab of the admin company page. */
function AdminCompanyPaymentsTabInternal() {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const { company } = useCompanyContext();
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<StripeInvoiceInterface | undefined>(undefined);

  // The rows are built in code from two requests (invoices and old one-time purchases), as
  // CancellationReasonsTable feeds computed rows. A failure of either request fails the whole tab:
  // a partial list would give a wrong total.
  const data: DataListRetriever<AdminPaymentRow> = useDataListRetriever({
    module: Modules.StripeInvoice,
    ready: !!company,
    retriever: async () => {
      try {
        const [invoices, purchases] = await Promise.all([
          StripeInvoiceService.findManyForCompany({ companyId: company!.id }),
          StripeSubscriptionService.findManyForCompany({ companyId: company!.id, oneTime: true }),
        ]);
        setFailed(false);
        return buildAdminPayments(invoices, purchases);
      } catch (error) {
        setFailed(true);
        throw error;
      }
    },
  });

  // The standard table looks its columns up by name; the payment rows have no module of their own.
  const tableType = useMemo(
    () => ({ ...Modules.StripeInvoice, name: ADMIN_COMPANY_PAYMENTS_TABLE }) as ModuleWithPermissions,
    [],
  );

  const rows = data.data ?? [];
  const totals = useMemo(() => totalsByCurrency(rows), [rows]);

  if (failed) {
    return (
      <p className="text-destructive text-xs/relaxed" data-testid="admin-company-payments-error">
        {t("billing.ui.admin_company.errors.payments")}
      </p>
    );
  }

  const totalText = (() => {
    if (!data.isLoaded || rows.length === 0) return undefined;
    if (totals.length > 0) return totals.map((x) => formatCurrency(x.amount, x.currency, fmt)).join(" · ");
    const currency = rows.find((row) => row.currency)?.currency ?? "eur";
    return formatCurrency(0, currency, fmt);
  })();

  return (
    <div className="flex flex-col gap-y-3" data-testid="admin-company-payments">
      {totalText && (
        <p className="text-sm text-end" data-testid="admin-company-payments-total">
          {t("billing.ui.admin_company.payments.total_paid", { amounts: totalText })}
        </p>
      )}
      <ContentListTable
        data={data}
        fields={FIELDS}
        tableGeneratorType={tableType}
        context={{ onOpenInvoice: (invoice: StripeInvoiceInterface) => setSelected(invoice) }}
        emptyState={
          <p className="text-sm" data-testid="admin-company-payments-empty">
            {t("billing.ui.admin_company.payments.empty")}
          </p>
        }
      />
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
    </div>
  );
}

export function AdminCompanyPaymentsTab() {
  return (
    <Suspense fallback={<Skeleton className="h-4 w-full" />}>
      <AdminCompanyPaymentsTabInternal />
    </Suspense>
  );
}
