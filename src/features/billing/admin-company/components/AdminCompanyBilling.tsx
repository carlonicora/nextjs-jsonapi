"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { Skeleton } from "../../../../shadcnui";
import { useCompanyContext } from "../../../company/contexts/CompanyContext";
import { StripeInvoiceInterface } from "../../stripe-invoice/data/stripe-invoice.interface";
import { StripeInvoiceService } from "../../stripe-invoice/data/stripe-invoice.service";
import { StripeSubscriptionInterface } from "../../stripe-subscription/data/stripe-subscription.interface";
import { StripeSubscriptionService } from "../../stripe-subscription/data/stripe-subscription.service";
import { AdminCompanyPayments } from "./AdminCompanyPayments";
import { AdminCompanySubscriptionCard } from "./AdminCompanySubscriptionCard";

function AdminCompanyBillingContent() {
  const t = useTranslations();
  const { company } = useCompanyContext();
  const companyId = company?.id;

  const [subscriptions, setSubscriptions] = useState<StripeSubscriptionInterface[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState<boolean>(true);
  const [subscriptionsError, setSubscriptionsError] = useState<string | undefined>(undefined);

  const [invoices, setInvoices] = useState<StripeInvoiceInterface[]>([]);
  const [purchases, setPurchases] = useState<StripeSubscriptionInterface[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState<boolean>(true);
  const [paymentsError, setPaymentsError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    const loadSubscriptions = async () => {
      setSubscriptionsLoading(true);
      setSubscriptionsError(undefined);
      try {
        const data = await StripeSubscriptionService.findManyForCompany({ companyId });
        if (!cancelled) setSubscriptions(data);
      } catch (error) {
        console.error("[AdminCompanyBilling] Failed to load subscriptions:", error);
        if (!cancelled) setSubscriptionsError(t("billing.ui.admin_company.errors.subscription"));
      } finally {
        if (!cancelled) setSubscriptionsLoading(false);
      }
    };

    // Both lists or neither: a partial payments list would give a wrong total.
    const loadPayments = async () => {
      setPaymentsLoading(true);
      setPaymentsError(undefined);
      try {
        const [invoiceData, purchaseData] = await Promise.all([
          StripeInvoiceService.findManyForCompany({ companyId }),
          StripeSubscriptionService.findManyForCompany({ companyId, oneTime: true }),
        ]);
        if (!cancelled) {
          setInvoices(invoiceData);
          setPurchases(purchaseData);
        }
      } catch (error) {
        console.error("[AdminCompanyBilling] Failed to load payments:", error);
        if (!cancelled) setPaymentsError(t("billing.ui.admin_company.errors.payments"));
      } finally {
        if (!cancelled) setPaymentsLoading(false);
      }
    };

    loadSubscriptions();
    loadPayments();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (!companyId) return null;

  return (
    <div className="space-y-4">
      <AdminCompanySubscriptionCard
        subscriptions={subscriptions}
        loading={subscriptionsLoading}
        error={subscriptionsError}
      />
      <AdminCompanyPayments invoices={invoices} purchases={purchases} loading={paymentsLoading} error={paymentsError} />
    </div>
  );
}

/**
 * The platform administrator's read-only billing view of the company in `CompanyContext`: the
 * current subscription and every payment.
 */
export function AdminCompanyBilling() {
  // useBillingFormatOptions suspends on the session.
  return (
    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
      <AdminCompanyBillingContent />
    </Suspense>
  );
}
