import { ApiDataInterface } from "../../../../core";

export interface StripeProductInterface extends ApiDataInterface {
  get stripeProductId(): string;
  get name(): string;
  get description(): string | undefined;
  get active(): boolean;
  get metadata(): Record<string, any> | undefined;
}

export type StripeProductInput = {
  id: string;
  name?: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, any>;
};
