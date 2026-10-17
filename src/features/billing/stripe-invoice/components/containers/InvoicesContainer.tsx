"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../../../../../shadcnui";
import { InvoiceStatus, StripeInvoiceInterface } from "../../data/stripe-invoice.interface";
import { StripeInvoiceService } from "../../data/stripe-invoice.service";
import { InvoicesList } from "../lists/InvoicesList";

type StatusFilter = InvoiceStatus | "all";

export function InvoicesContainer() {
  const t = useTranslations();
  const [invoices, setInvoices] = useState<StripeInvoiceInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
      const data = await StripeInvoiceService.listInvoices(params);
      setInvoices(data);
    } catch (error) {
      console.error("[InvoicesContainer] Failed to load invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={handleFilterChange}>
        <TabsList>
          <TabsTrigger value="all">{t("billing.ui.invoices.filter_all")}</TabsTrigger>
          <TabsTrigger value={InvoiceStatus.PAID}>{t("billing.ui.invoice_status.paid")}</TabsTrigger>
          <TabsTrigger value={InvoiceStatus.OPEN}>{t("billing.ui.invoice_status.open")}</TabsTrigger>
          <TabsTrigger value={InvoiceStatus.VOID}>{t("billing.ui.invoice_status.void")}</TabsTrigger>
          <TabsTrigger value={InvoiceStatus.UNCOLLECTIBLE}>{t("billing.ui.invoice_status.uncollectible")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {loading && <div className="text-center py-8 text-muted-foreground">{t("billing.ui.invoices.loading")}</div>}

      {/* Empty State */}
      {!loading && invoices.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-lg font-medium text-muted-foreground mb-2">{t("billing.ui.invoices.empty_title")}</p>
          <p className="text-sm text-muted-foreground">{t("billing.ui.invoices.empty_description")}</p>
        </div>
      )}

      {/* Invoices List */}
      {!loading && invoices.length > 0 && <InvoicesList invoices={invoices} onInvoicesChange={loadInvoices} />}
    </div>
  );
}
