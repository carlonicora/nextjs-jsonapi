import { ApiDataInterface } from "../../../../core";

// ============================================================================
// Usage Record Interfaces
// ============================================================================

export interface StripeUsageInterface extends ApiDataInterface {
  get subscriptionId(): string;
  get meterId(): string;
  get meterEventName(): string;
  get stripeEventId(): string;
  get quantity(): number;
  get timestamp(): Date | undefined;
}

// ============================================================================
// Meter Interfaces
// ============================================================================

export interface MeterInterface {
  id: string;
  displayName: string;
  eventName: string;
  status: string;
}

export interface MeterSummaryInterface {
  meterId: string;
  start: Date;
  end: Date;
  aggregatedValue: number;
}

export interface UsageSummaryInterface {
  subscriptionItemId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalUsage: number;
}

// ============================================================================
// Usage Input DTOs
// ============================================================================

export type ReportUsageInput = {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: "increment" | "set";
};

// Backwards compatibility alias
export type UsageRecordInterface = StripeUsageInterface;
