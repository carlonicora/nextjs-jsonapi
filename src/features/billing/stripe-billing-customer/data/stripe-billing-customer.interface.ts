import { ApiDataInterface } from "../../../../core";

// ============================================================================
// Billing Customer Interfaces
// ============================================================================

export interface StripeBillingCustomerInterface extends ApiDataInterface {
  get stripeCustomerId(): string;
  get email(): string | undefined;
  get name(): string | undefined;
  get defaultPaymentMethodId(): string | undefined;
  get currency(): string | undefined;
  get balance(): number | undefined;
  get delinquent(): boolean;
  get metadata(): Record<string, any> | undefined;
}
