"use client";

import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { BillingService } from "../../data/billing.service";
import { MeterInterface, MeterSummaryInterface } from "../../data/usage-record.interface";
import { StripeSubscriptionInterface, StripeSubscriptionService } from "../../stripe-subscription";
import { UsageSummaryCards } from "../widgets/UsageSummaryCards";

export function UsageContainer() {
  const [meters, setMeters] = useState<MeterInterface[]>([]);
  const [summaries, setSummaries] = useState<Record<string, MeterSummaryInterface | null>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [subscriptions, setSubscriptions] = useState<StripeSubscriptionInterface[]>([]);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    console.log("[UsageContainer] Loading usage data...");
    setLoading(true);

    try {
      // First, check if there are any metered subscriptions
      const fetchedSubscriptions = await StripeSubscriptionService.listSubscriptions();
      console.log("[UsageContainer] Loaded subscriptions:", fetchedSubscriptions);
      setSubscriptions(fetchedSubscriptions);

      const hasMeteredSubscriptions = fetchedSubscriptions.some(
        (sub) => sub.price?.recurring?.usageType === "metered",
      );

      console.log("[UsageContainer] Has metered subscriptions:", hasMeteredSubscriptions);

      if (!hasMeteredSubscriptions) {
        console.log("[UsageContainer] No metered subscriptions found, skipping meter load");
        setLoading(false);
        return;
      }

      // Load meters
      const fetchedMeters = await BillingService.listMeters();
      console.log("[UsageContainer] Loaded meters:", fetchedMeters);
      setMeters(fetchedMeters);

      // Load summaries for each meter (current month)
      const summariesMap: Record<string, MeterSummaryInterface | null> = {};
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      console.log("[UsageContainer] Loading summaries for period:", startOfMonth, "to", endOfMonth);

      for (const meter of fetchedMeters) {
        try {
          const meterSummaries = await BillingService.getMeterSummaries({
            meterId: meter.id,
            start: startOfMonth,
            end: endOfMonth,
          });
          console.log(`[UsageContainer] Loaded summaries for meter ${meter.id}:`, meterSummaries);
          // Use the first (most recent) summary
          summariesMap[meter.id] = meterSummaries.length > 0 ? meterSummaries[0] : null;
        } catch (error) {
          console.error(`[UsageContainer] Failed to load summaries for meter ${meter.id}:`, error);
          summariesMap[meter.id] = null;
        }
      }

      setSummaries(summariesMap);
    } catch (error) {
      console.error("[UsageContainer] Failed to load usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if there are any metered subscriptions
  const hasMeteredSubscriptions = subscriptions.some((sub) => sub.price?.recurring?.usageType === "metered");

  // Don't render if no metered subscriptions
  if (!loading && !hasMeteredSubscriptions) {
    console.log("[UsageContainer] No metered subscriptions, not rendering");
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading usage data...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center gap-x-3">
        <Activity className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Usage Tracking</h1>
      </div>

      {/* Empty State */}
      {meters.length === 0 && (
        <div className="bg-muted/50 flex flex-col items-center justify-center gap-y-4 rounded-lg border-2 border-dashed border-gray-300 p-12">
          <Activity className="text-muted-foreground h-16 w-16" />
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">No usage meters configured</h3>
            <p className="text-muted-foreground">
              Usage tracking will appear here when you have metered subscriptions with configured meters.
            </p>
          </div>
        </div>
      )}

      {/* Usage Summary Cards */}
      {meters.length > 0 && <UsageSummaryCards meters={meters} summaries={summaries} />}
    </div>
  );
}
