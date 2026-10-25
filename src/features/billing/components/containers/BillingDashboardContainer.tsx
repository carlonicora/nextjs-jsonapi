"use client";

import { useTranslations } from "next-intl";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../shadcnui";
import { PaymentMethodInterface, StripeCustomerInterface, StripeCustomerService } from "../../stripe-customer";
import { PaymentMethodsContainer } from "../../stripe-customer/components";
import { StripeInvoiceInterface, StripeInvoiceService } from "../../stripe-invoice";
import { InvoicesContainer } from "../../stripe-invoice/components";
import { StripeSubscriptionInterface, StripeSubscriptionService, SubscriptionStatus } from "../../stripe-subscription";
import { SubscriptionsContainer } from "../../stripe-subscription/components";
import { SubscriptionWizard } from "../../stripe-subscription/components/wizards";
import { MeterInterface, MeterSummaryInterface, StripeUsageService } from "../../stripe-usage";
import { UsageContainer } from "../../stripe-usage/components";
import { resolveChangePlanTarget } from "../../data/credit-warning";
import {
  BillingUsageSummaryCard,
  CustomerInfoCard,
  InvoicesSummaryCard,
  PaymentMethodSummaryCard,
  SubscriptionSummaryCard,
} from "../cards";
import { BillingDetailModal } from "../modals/BillingDetailModal";
import { urlWithoutParam } from "../utils/url";
import { BillingAlertBanner } from "../widgets/BillingAlertBanner";

type ModalType = "subscriptions" | "payment-methods" | "invoices" | "usage" | null;

type DataState = {
  customer: StripeCustomerInterface | null;
  subscriptions: StripeSubscriptionInterface[];
  paymentMethods: PaymentMethodInterface[];
  invoices: StripeInvoiceInterface[];
  meters: MeterInterface[];
  meterSummaries: Record<string, MeterSummaryInterface | null>;
};

type LoadingState = {
  customer: boolean;
  subscriptions: boolean;
  paymentMethods: boolean;
  invoices: boolean;
  usage: boolean;
};

type ErrorState = {
  customer: string | null;
  subscriptions: string | null;
  paymentMethods: string | null;
  invoices: string | null;
  usage: string | null;
};

export function BillingDashboardContainer() {
  const t = useTranslations();
  const [data, setData] = useState<DataState>({
    customer: null,
    subscriptions: [],
    paymentMethods: [],
    invoices: [],
    meters: [],
    meterSummaries: {},
  });

  const [loading, setLoading] = useState<LoadingState>({
    customer: true,
    subscriptions: true,
    paymentMethods: true,
    invoices: true,
    usage: true,
  });

  // Error state holds message keys; they are translated at render time.
  const [errors, setErrors] = useState<ErrorState>({
    customer: null,
    subscriptions: null,
    paymentMethods: null,
    invoices: null,
    usage: null,
  });

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [noCustomerExists, setNoCustomerExists] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const searchParams = useSearchParams();

  // Wizard state - lifted from SubscriptionsContainer to avoid nested dialogs
  const [showWizard, setShowWizard] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<StripeSubscriptionInterface | null>(null);

  // `?action=change-plan` needs the subscriptions to pick the wizard's target, so the
  // URL effect only records the intent and a second effect acts on it once they load.
  const [pendingChangePlan, setPendingChangePlan] = useState(false);

  // Check if company has metered subscriptions
  const hasMeteredSubscriptions = useCallback((): boolean => {
    return data.subscriptions.some((sub) => sub.price?.recurring?.usageType === "metered");
  }, [data.subscriptions]);

  // Check if user has active recurring subscription (for wizard filtering)
  const hasActiveRecurringSubscription = useMemo(() => {
    return data.subscriptions.some(
      (sub) =>
        (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIALING) &&
        sub.price?.priceType === "recurring",
    );
  }, [data.subscriptions]);

  // Fetch all data - first check customer, then fetch rest if customer exists
  const fetchAllData = useCallback(async () => {
    setNoCustomerExists(false);

    // First, try to fetch customer
    let customer: StripeCustomerInterface | null = null;
    try {
      customer = await StripeCustomerService.getCustomer();
      setData((prev) => ({ ...prev, customer }));
      setErrors((prev) => ({ ...prev, customer: null }));
      setNoCustomerExists(false);
    } catch (error: unknown) {
      console.error("[BillingDashboard] Failed to load customer:", error);
      // A 404 means the company has no billing customer yet - a setup prompt, not an error.
      // Match on the status, never on the message: `statusText` is empty over HTTP/2, so the
      // error text carries no reason phrase to match against.
      if ((error as { status?: number })?.status === 404) {
        setNoCustomerExists(true);
      } else {
        setErrors((prev) => ({ ...prev, customer: "billing.ui.dashboard.errors.load_customer" }));
      }
    } finally {
      setLoading((prev) => ({ ...prev, customer: false }));
    }

    // Without a customer there is nothing downstream to fetch. Release every section here, or the
    // cards that are only cleared inside their own fetchers stay skeletons forever.
    if (!customer) {
      setLoading({
        customer: false,
        subscriptions: false,
        paymentMethods: false,
        invoices: false,
        usage: false,
      });
      return;
    }

    // Fetch subscriptions
    const fetchSubscriptions = async () => {
      try {
        const subscriptions = await StripeSubscriptionService.listSubscriptions();
        setData((prev) => ({ ...prev, subscriptions }));
        setErrors((prev) => ({ ...prev, subscriptions: null }));
        return subscriptions;
      } catch (error) {
        console.error("[BillingDashboard] Failed to load subscriptions:", error);
        setErrors((prev) => ({ ...prev, subscriptions: "billing.ui.dashboard.errors.load_subscriptions" }));
        return [];
      } finally {
        setLoading((prev) => ({ ...prev, subscriptions: false }));
      }
    };

    // Fetch payment methods
    const fetchPaymentMethods = async () => {
      try {
        const paymentMethods = await StripeCustomerService.listPaymentMethods();
        setData((prev) => ({ ...prev, paymentMethods }));
        setErrors((prev) => ({ ...prev, paymentMethods: null }));
      } catch (error) {
        console.error("[BillingDashboard] Failed to load payment methods:", error);
        setErrors((prev) => ({ ...prev, paymentMethods: "billing.ui.dashboard.errors.load_payment_methods" }));
      } finally {
        setLoading((prev) => ({ ...prev, paymentMethods: false }));
      }
    };

    // Fetch invoices
    const fetchInvoices = async () => {
      try {
        const invoices = await StripeInvoiceService.listInvoices();
        setData((prev) => ({ ...prev, invoices }));
        setErrors((prev) => ({ ...prev, invoices: null }));
      } catch (error) {
        console.error("[BillingDashboard] Failed to load invoices:", error);
        setErrors((prev) => ({ ...prev, invoices: "billing.ui.dashboard.errors.load_invoices" }));
      } finally {
        setLoading((prev) => ({ ...prev, invoices: false }));
      }
    };

    // Execute all in parallel
    const [subscriptions] = await Promise.all([fetchSubscriptions(), fetchPaymentMethods(), fetchInvoices()]);

    // Check if there are metered subscriptions and fetch usage data
    const hasMetered = subscriptions.some(
      (sub: StripeSubscriptionInterface) => sub.price?.recurring?.usageType === "metered",
    );

    if (hasMetered) {
      await fetchUsageData();
    } else {
      setLoading((prev) => ({ ...prev, usage: false }));
    }
  }, []);

  // Create a new Stripe customer for the company
  const handleCreateCustomer = async () => {
    setCreatingCustomer(true);
    try {
      await StripeCustomerService.createCustomer();
      setNoCustomerExists(false);
      // Refresh all data after customer creation
      await fetchAllData();
    } catch (error) {
      console.error("[BillingDashboard] Failed to create customer:", error);
      setErrors((prev) => ({ ...prev, customer: "billing.ui.dashboard.errors.setup" }));
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Fetch usage data (called conditionally)
  const fetchUsageData = async () => {
    try {
      const meters = await StripeUsageService.listMeters();
      setData((prev) => ({ ...prev, meters }));

      // Load summaries for each meter (current month)
      const summariesMap: Record<string, MeterSummaryInterface | null> = {};
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      for (const meter of meters) {
        try {
          const meterSummaries = await StripeUsageService.getMeterSummaries({
            meterId: meter.id,
            startTime: startOfMonth,
            endTime: endOfMonth,
          });
          summariesMap[meter.id] = meterSummaries.length > 0 ? meterSummaries[0] : null;
        } catch (error) {
          console.error(`[BillingDashboard] Failed to load summaries for meter ${meter.id}:`, error);
          summariesMap[meter.id] = null;
        }
      }

      setData((prev) => ({ ...prev, meterSummaries: summariesMap }));
      setErrors((prev) => ({ ...prev, usage: null }));
    } catch (error) {
      console.error("[BillingDashboard] Failed to load usage data:", error);
      setErrors((prev) => ({ ...prev, usage: "billing.ui.dashboard.errors.load_usage" }));
    } finally {
      setLoading((prev) => ({ ...prev, usage: false }));
    }
  };

  // Refresh data after modal actions
  const refreshData = useCallback(async () => {
    // Reset loading states for a refresh
    setLoading({
      customer: true,
      subscriptions: true,
      paymentMethods: true,
      invoices: true,
      usage: true,
    });
    await fetchAllData();
  }, [fetchAllData]);

  // Handler to open wizard (can be called from SubscriptionsContainer)
  const handleOpenWizard = useCallback((subscription?: StripeSubscriptionInterface) => {
    setEditingSubscription(subscription || null);
    setShowWizard(true);
  }, []);

  // Handler to close wizard
  const handleWizardClose = useCallback(() => {
    setShowWizard(false);
    setEditingSubscription(null);
    refreshData();
  }, [refreshData]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle URL action parameter for deep linking. `?action=subscribe` records the
  // intent to subscribe; the wizard itself only renders once a customer exists, so a
  // company without one sees the setup card first and the wizard opens right after
  // "Set Up Billing Account" succeeds. `?action=change-plan` records a pending intent
  // that the effect below resolves once the subscriptions have loaded.
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "subscribe" || action === "change-plan") {
      if (action === "subscribe") setShowWizard(true);
      else setPendingChangePlan(true);
      // Drop only `action`, so a refresh does not re-trigger it. Every other parameter
      // must survive: a host page (the settings hub) selects this dashboard through
      // `?section=`, and losing it switches the page away and unmounts this component.
      window.history.replaceState(
        window.history.state,
        "",
        urlWithoutParam({
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          param: "action",
        }),
      );
    }
  }, [searchParams]);

  // Act on a pending `?action=change-plan` once the subscriptions fetch has finished:
  // open the wizard on the active or trialing recurring subscription, or the subscribe
  // wizard when there is none. The intent is cleared in the same step, so the reload
  // after the wizard closes does not open it again.
  useEffect(() => {
    if (!pendingChangePlan || loading.subscriptions) return;
    setPendingChangePlan(false);
    handleOpenWizard(resolveChangePlanTarget(data.subscriptions));
  }, [pendingChangePlan, loading.subscriptions, data.subscriptions, handleOpenWizard]);

  // Detect critical subscriptions for alert banners
  const criticalSubscriptions = data.subscriptions.filter(
    (sub) =>
      sub.status === SubscriptionStatus.PAST_DUE ||
      (sub.status === SubscriptionStatus.TRIALING &&
        sub.trialEnd &&
        new Date(sub.trialEnd).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000),
  );

  // Handle modal close with refresh
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setActiveModal(null);
      refreshData();
    }
  };

  // Get modal title based on type
  const getModalTitle = (type: ModalType): string => {
    switch (type) {
      case "subscriptions":
        return t("billing.ui.dashboard.modal.subscriptions");
      case "payment-methods":
        return t("billing.ui.payment_methods.title");
      case "invoices":
        return t("billing.ui.dashboard.modal.invoices");
      case "usage":
        return t("billing.ui.usage.title");
      default:
        return "";
    }
  };

  // Show loading state while checking for customer
  const isInitialLoading = loading.customer && !noCustomerExists && !data.customer;

  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center gap-x-3">
        <Wallet className="h-8 w-8" />
        <h1 className="text-primary text-3xl font-semibold">{t("billing.title")}</h1>
      </div>

      {/* Initial Loading State */}
      {isInitialLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* No Customer State - Show Setup Prompt */}
      {noCustomerExists && !isInitialLoading && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t("billing.ui.dashboard.setup_title")}</CardTitle>
            <CardDescription>{t("billing.ui.dashboard.setup_description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button onClick={handleCreateCustomer} disabled={creatingCustomer} size="lg">
              {creatingCustomer ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("billing.ui.dashboard.setting_up")}
                </>
              ) : (
                t("billing.ui.dashboard.setup_button")
              )}
            </Button>
          </CardContent>
          {errors.customer && (
            <CardContent className="pt-0">
              <p className="text-center text-destructive text-xs/relaxed">{t(errors.customer)}</p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Main Dashboard Content - Only shown when customer exists */}
      {!noCustomerExists && !isInitialLoading && (
        <>
          {/* Alert Banners */}
          {criticalSubscriptions.map((subscription) => (
            <BillingAlertBanner
              key={subscription.id}
              subscription={subscription}
              onUpdatePayment={() => setActiveModal("payment-methods")}
              onAddPayment={() => setActiveModal("payment-methods")}
            />
          ))}

          {/* Summary Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <SubscriptionSummaryCard
              subscriptions={data.subscriptions}
              loading={loading.subscriptions}
              error={errors.subscriptions ? t(errors.subscriptions) : undefined}
              onManageClick={() => {
                if (data.subscriptions.length === 0) {
                  // No subscriptions - open wizard directly
                  setShowWizard(true);
                } else {
                  // Has subscriptions - open manage modal
                  setActiveModal("subscriptions");
                }
              }}
            />

            <PaymentMethodSummaryCard
              paymentMethods={data.paymentMethods}
              defaultPaymentMethodId={data.customer?.defaultPaymentMethodId}
              loading={loading.paymentMethods}
              error={errors.paymentMethods ? t(errors.paymentMethods) : undefined}
              onManageClick={() => setActiveModal("payment-methods")}
            />

            <CustomerInfoCard
              customer={data.customer}
              loading={loading.customer}
              error={errors.customer ? t(errors.customer) : undefined}
            />

            <InvoicesSummaryCard
              invoices={data.invoices}
              loading={loading.invoices}
              error={errors.invoices ? t(errors.invoices) : undefined}
              onViewAllClick={() => setActiveModal("invoices")}
            />

            {/* Usage Card - only shown when metered subscriptions exist */}
            {hasMeteredSubscriptions() && (
              <BillingUsageSummaryCard
                meters={data.meters}
                summaries={data.meterSummaries}
                loading={loading.usage}
                error={errors.usage ? t(errors.usage) : undefined}
                onViewDetailsClick={() => setActiveModal("usage")}
              />
            )}
          </div>

          {/* Detail Modals */}
          <BillingDetailModal
            open={activeModal === "subscriptions"}
            onOpenChange={handleModalClose}
            title={getModalTitle("subscriptions")}
          >
            {/* The dashboard's list, so a wizard success (refreshData) refreshes the dialog too */}
            <SubscriptionsContainer
              onOpenWizard={handleOpenWizard}
              hasActiveRecurringSubscription={hasActiveRecurringSubscription}
              subscriptions={data.subscriptions}
              onSubscriptionsChange={refreshData}
            />
          </BillingDetailModal>

          <BillingDetailModal
            open={activeModal === "payment-methods"}
            onOpenChange={handleModalClose}
            title={getModalTitle("payment-methods")}
          >
            <PaymentMethodsContainer />
          </BillingDetailModal>

          <BillingDetailModal
            open={activeModal === "invoices"}
            onOpenChange={handleModalClose}
            title={getModalTitle("invoices")}
          >
            <InvoicesContainer />
          </BillingDetailModal>

          <BillingDetailModal
            open={activeModal === "usage"}
            onOpenChange={handleModalClose}
            title={getModalTitle("usage")}
          >
            <UsageContainer />
          </BillingDetailModal>

          {/* Subscription Wizard - rendered at dashboard level to avoid nested dialogs */}
          <SubscriptionWizard
            open={showWizard && !!data.customer}
            onOpenChange={(open) => !open && handleWizardClose()}
            onSuccess={refreshData}
            hasActiveRecurringSubscription={hasActiveRecurringSubscription}
            subscription={editingSubscription ?? undefined}
          />
        </>
      )}
    </div>
  );
}
