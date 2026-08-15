"use client";

import { DateRangeSelector } from "../../../components/forms/DateRangeSelector";

type Props = {
  /** Receives ONLY the keys that changed. */
  onChange: (next: { from?: string; to?: string }) => void;
};

/**
 * The single control row above the KPI tiles.
 *
 * Deliberately stateless: the control reports the keys it changed and the owning
 * context re-fetches, which is what lets the page issue a single coordinated
 * batch of requests instead of one per control.
 *
 * There is NO metric selector. A game master is billed in credits, so credits
 * are the only unit this surface speaks: cost would leak platform margin (the
 * controller rejects metric=cost outright) and a raw token count is an
 * implementation detail nobody is charged for. There is no company selector
 * either — a self-service caller has exactly one company.
 */
export function TokenUsageReportFilterBar({ onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangeSelector
        onDateChange={(range) => {
          if (!range?.from || !range?.to) return;
          onChange({ from: range.from.toISOString(), to: range.to.toISOString() });
        }}
      />
    </div>
  );
}
