"use client";

import { MeterInterface, MeterSummaryInterface } from "../../data/usage-record.interface";
import { UsageSummaryCard } from "../details/UsageSummaryCard";

type UsageSummaryCardsProps = {
  meters: MeterInterface[];
  summaries: Record<string, MeterSummaryInterface | null>;
};

export function UsageSummaryCards({ meters, summaries }: UsageSummaryCardsProps) {
  console.log("[UsageSummaryCards] Rendering with meters:", meters, "summaries:", summaries);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {meters.map((meter) => (
        <UsageSummaryCard key={meter.id} meter={meter} summary={summaries[meter.id] || null} />
      ))}
    </div>
  );
}
