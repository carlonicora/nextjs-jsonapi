export type Granularity = "day" | "week" | "month";
export type StackBy = "scope" | "type" | "company";
export type Dimension = "company" | "user" | "operation";
export type Scope = "customer" | "platform";
export type Metric = "cost" | "credits" | "tokens";

export type TokenUsageAdminFilters = {
  /** ISO 8601 instant. */
  from: string;
  /** ISO 8601 instant. */
  to: string;
  companyId?: string;
};

// Input types for createJsonApi(). `id` is always required — JSON:API resource
// objects are identified.

export type TokenUsageAdminSummaryInput = {
  id: string;
  scope: string;
  window: string;
  cost: number;
  credits: number;
  tokensIn: number;
  tokensOut: number;
  cached: number;
  calls: number;
};

export type TokenUsageAdminTimelineInput = {
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

export type TokenUsageAdminBreakdownInput = {
  id: string;
  label: string;
  sublabel?: string;
  cost: number;
  credits: number;
  tokensIn: number;
  tokensOut: number;
  cached: number;
  calls: number;
  activeUsers?: number;
  monthlyCredits?: number;
  availableMonthlyCredits?: number;
};
