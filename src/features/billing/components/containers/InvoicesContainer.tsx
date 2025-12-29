"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../../../../shadcnui";
import { BillingService } from "../../data/billing.service";
import { InvoiceInterface, InvoiceStatus } from "../../data/billing.interface";
import { InvoicesList } from "../lists/InvoicesList";

type StatusFilter = InvoiceStatus | "all";

export function InvoicesContainer() {
  const [invoices, setInvoices] = useState<InvoiceInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadInvoices = async () => {
    console.log("[InvoicesContainer] Loading invoices with filter:", statusFilter);
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
      const data = await BillingService.listInvoices(params);
      console.log("[InvoicesContainer] Loaded invoices:", data.length);
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
    console.log("[InvoicesContainer] Filter changed to:", value);
    setStatusFilter(value as StatusFilter);
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={handleFilterChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={InvoiceStatus.PAID}>Paid</TabsTrigger>
          <TabsTrigger value={InvoiceStatus.OPEN}>Open</TabsTrigger>
          <TabsTrigger value={InvoiceStatus.VOID}>Void</TabsTrigger>
          <TabsTrigger value={InvoiceStatus.UNCOLLECTIBLE}>Uncollectible</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading invoices...
        </div>
      )}

      {/* Empty State */}
      {!loading && invoices.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-lg font-medium text-muted-foreground mb-2">No invoices yet</p>
          <p className="text-sm text-muted-foreground">
            Invoices will appear here after your first billing cycle
          </p>
        </div>
      )}

      {/* Invoices List */}
      {!loading && invoices.length > 0 && (
        <InvoicesList invoices={invoices} onInvoicesChange={loadInvoices} />
      )}
    </div>
  );
}
