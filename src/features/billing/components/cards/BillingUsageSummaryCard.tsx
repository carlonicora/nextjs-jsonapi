"use client";

import { Activity, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "../../../../shadcnui";
import { MeterInterface, MeterSummaryInterface } from "../../stripe-usage";

type BillingUsageSummaryCardProps = {
  meters: MeterInterface[];
  summaries: Record<string, MeterSummaryInterface | null>;
  loading?: boolean;
  error?: string;
  onViewDetailsClick: () => void;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

export function BillingUsageSummaryCard({
  meters,
  summaries,
  loading,
  error,
  onViewDetailsClick,
}: BillingUsageSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total usage across all meters
  const totalUsage = Object.values(summaries).reduce((acc, summary) => {
    return acc + (summary?.aggregatedValue || 0);
  }, 0);

  // Get first meter with data for display
  const primaryMeter = meters.find((m) => summaries[m.id]?.aggregatedValue);
  const primarySummary = primaryMeter ? summaries[primaryMeter.id] : null;

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onViewDetailsClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {meters.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">No meters</p>
            <p className="text-xs text-muted-foreground">No usage meters are configured</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xl font-bold">{formatNumber(totalUsage)} units</p>
            {primaryMeter && primarySummary && (
              <p className="text-sm text-muted-foreground">
                {primaryMeter.displayName}: {formatNumber(primarySummary.aggregatedValue)}
              </p>
            )}
            {meters.length > 1 && <p className="text-xs text-muted-foreground">Across {meters.length} meters</p>}
            <span className="flex items-center text-xs text-muted-foreground">
              View details
              <ChevronRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
