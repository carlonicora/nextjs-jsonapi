"use client";

import { CreditCard, Loader2, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../shadcnui";
import { PaymentMethodInterface, StripeCustomerInterface, StripeCustomerService } from "../../stripe-customer";
import { PaymentMethodsContainer } from "../../stripe-customer/components";
import { StripeInvoiceInterface, StripeInvoiceService } from "../../stripe-invoice";
import { InvoicesContainer } from "../../stripe-invoice/components";
import { StripeSubscriptionInterface, StripeSubscriptionService, SubscriptionStatus } from "../../stripe-subscription";
import { SubscriptionsContainer } from "../../stripe-subscription/components";
import { MeterInterface, MeterSummaryInterface, StripeUsageService } from "../../stripe-usage";
import { UsageContainer } from "../../stripe-usage/components";
import {
  BillingUsageSummaryCard,
  CustomerInfoCard,
  InvoicesSummaryCard,
  PaymentMethodSummaryCard,
  SubscriptionSummaryCard,
} from "../cards";
import { BillingDetailModal } from "../modals/BillingDetailModal";
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

  // Check if company has metered subscriptions
  const hasMeteredSubscriptions = useCallback((): boolean => {
    return data.subscriptions.some((sub) => sub.price?.recurring?.usageType === "metered");
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
      // Check if this is a "not found" error indicating no customer exists
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Not Found") || errorMessage.includes("not found")) {
        setNoCustomerExists(true);
        // Stop loading all sections since no customer exists
        setLoading({
          customer: false,
          subscriptions: false,
          paymentMethods: false,
          invoices: false,
          usage: false,
        });
        return; // Don't try to fetch other data
      }
      setErrors((prev) => ({ ...prev, customer: "Failed to load billing account" }));
    } finally {
      setLoading((prev) => ({ ...prev, customer: false }));
    }

    // If we have a customer, fetch the rest of the data
    if (customer) {
      // Fetch subscriptions
      const fetchSubscriptions = async () => {
        try {
          const subscriptions = await StripeSubscriptionService.listSubscriptions();
          setData((prev) => ({ ...prev, subscriptions }));
          setErrors((prev) => ({ ...prev, subscriptions: null }));
          return subscriptions;
        } catch (error) {
          console.error("[BillingDashboard] Failed to load subscriptions:", error);
          setErrors((prev) => ({ ...prev, subscriptions: "Failed to load subscriptions" }));
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
          setErrors((prev) => ({ ...prev, paymentMethods: "Failed to load payment methods" }));
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
          setErrors((prev) => ({ ...prev, invoices: "Failed to load invoices" }));
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
      setErrors((prev) => ({ ...prev, customer: "Failed to set up billing" }));
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
      setErrors((prev) => ({ ...prev, usage: "Failed to load usage data" }));
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

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
        return "Manage Subscriptions";
      case "payment-methods":
        return "Payment Methods";
      case "invoices":
        return "Invoice History";
      case "usage":
        return "Usage Tracking";
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
        <h1 className="text-3xl font-bold">Billing</h1>
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
            <CardTitle>Set Up Billing</CardTitle>
            <CardDescription>
              Your company doesn&apos;t have a billing account yet. Set one up to manage subscriptions, payment methods,
              and view invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button onClick={handleCreateCustomer} disabled={creatingCustomer} size="lg">
              {creatingCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set Up Billing Account"
              )}
            </Button>
          </CardContent>
          {errors.customer && (
            <CardContent className="pt-0">
              <p className="text-center text-sm text-destructive">{errors.customer}</p>
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
              error={errors.subscriptions || undefined}
              onManageClick={() => setActiveModal("subscriptions")}
            />

            <PaymentMethodSummaryCard
              paymentMethods={data.paymentMethods}
              defaultPaymentMethodId={data.customer?.defaultPaymentMethodId}
              loading={loading.paymentMethods}
              error={errors.paymentMethods || undefined}
              onManageClick={() => setActiveModal("payment-methods")}
            />

            <CustomerInfoCard
              customer={data.customer}
              loading={loading.customer}
              error={errors.customer || undefined}
            />

            <InvoicesSummaryCard
              invoices={data.invoices}
              loading={loading.invoices}
              error={errors.invoices || undefined}
              onViewAllClick={() => setActiveModal("invoices")}
            />

            {/* Usage Card - only shown when metered subscriptions exist */}
            {hasMeteredSubscriptions() && (
              <BillingUsageSummaryCard
                meters={data.meters}
                summaries={data.meterSummaries}
                loading={loading.usage}
                error={errors.usage || undefined}
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
            <SubscriptionsContainer />
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
        </>
      )}
    </div>
  );
}
