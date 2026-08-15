/** Metrics the self-service surface may request. `cost` is deliberately absent. */
export type ReportMetric = "credits" | "tokens";

/** Dimensions the self-service breakdown can group by. */
export type ReportDimension = "operation" | "target";

export type TokenUsageReportFilters = {
  /** ISO 8601 instant. */
  from: string;
  /** ISO 8601 instant. */
  to: string;
};

// Input types for createJsonApi(). `id` is always required — JSON:API resource
// objects are identified.

export type TokenUsageReportSummaryInput = {
  id: string;
  window: string;
  cost: number;
  credits: number;
  tokensIn: number;
  tokensOut: number;
  cached: number;
  calls: number;
};

export type TokenUsageReportTimelineInput = {
  id: string;
  /** Backend field type is "date" — emitted via formatLocalDate, never raw. */
  bucket: Date;
  series: string;
  cost: number;
  credits: number;
  tokensIn: number;
  tokensOut: number;
  cached: number;
  calls: number;
};

export type TokenUsageReportBreakdownInput = {
  id: string;
  label: string;
  sublabel?: string;
  cost: number;
  credits: number;
  tokensIn: number;
  tokensOut: number;
  cached: number;
  calls: number;
};
