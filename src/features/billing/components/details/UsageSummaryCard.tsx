"use client";

import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../../shadcnui";
import { MeterInterface, MeterSummaryInterface } from "../../data/usage-record.interface";

type UsageSummaryCardProps = {
  meter: MeterInterface;
  summary: MeterSummaryInterface | null;
};

/**
 * Get progress bar color based on usage percentage
 */
function getProgressColor(percentage: number | null): string {
  if (percentage === null) return "bg-blue-500";
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-orange-500";
  return "bg-green-500";
}

/**
 * Format a Unix timestamp to readable date
 */
function formatDate(date: Date | undefined): string {
  if (!date) return "N/A";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  } catch (error) {
    return "Invalid Date";
  }
}

export function UsageSummaryCard({ meter, summary }: UsageSummaryCardProps) {
  console.log("[UsageSummaryCard] Rendering meter:", meter, "summary:", summary);

  const currentUsage = summary?.aggregatedValue ?? 0;
  const limit = (meter as any).limit; // Meters may have optional limit field
  const percentage = limit && limit > 0 ? (currentUsage / limit) * 100 : null;
  const progressColor = getProgressColor(percentage);
  const progressWidth = percentage !== null ? Math.min(percentage, 100) : 0;

  const displayName = meter.displayName || meter.eventName;
  const hasLimit = limit !== null && limit !== undefined;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-x-3 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold">{displayName}</h3>
          <p className="text-xs text-gray-500">{meter.id}</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-4">
        {/* Current Usage */}
        <div>
          <p className="text-3xl font-bold">{currentUsage.toLocaleString()}</p>
          {hasLimit && <p className="text-sm text-gray-500">of {limit.toLocaleString()} used</p>}
        </div>

        {/* Progress Bar */}
        {hasLimit ? (
          <div className="flex flex-col gap-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className={`h-full transition-all ${progressColor}`} style={{ width: `${progressWidth}%` }} />
            </div>
            <p className="text-sm text-gray-500">{percentage?.toFixed(1)}% used</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No limit set</p>
        )}

        {/* Period Information */}
        {summary && summary.start && summary.end && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500">
              Period: {formatDate(summary.start)} - {formatDate(summary.end)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
