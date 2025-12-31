import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../../core";
import { StripeCustomerInterface } from "./stripe-customer.interface";

export class StripeCustomer extends AbstractApiData implements StripeCustomerInterface {
  private _stripeCustomerId?: string;
  private _email?: string;
  private _name?: string;
  private _defaultPaymentMethodId?: string;
  private _currency?: string;
  private _balance?: number;
  private _delinquent: boolean = false;
  private _metadata?: Record<string, any>;

  get stripeCustomerId(): string {
    if (!this._stripeCustomerId) throw new Error("stripeCustomerId is not defined");
    return this._stripeCustomerId;
  }

  get email(): string | undefined {
    return this._email;
  }

  get name(): string | undefined {
    return this._name;
  }

  get defaultPaymentMethodId(): string | undefined {
    return this._defaultPaymentMethodId;
  }

  get currency(): string | undefined {
    return this._currency;
  }

  get balance(): number | undefined {
    return this._balance;
  }

  get delinquent(): boolean {
    return this._delinquent;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._stripeCustomerId = data.jsonApi.attributes.stripeCustomerId;
    this._email = data.jsonApi.attributes.email;
    this._name = data.jsonApi.attributes.name;
    this._defaultPaymentMethodId = data.jsonApi.attributes.defaultPaymentMethodId;
    this._currency = data.jsonApi.attributes.currency;
    this._balance = data.jsonApi.attributes.balance;
    this._delinquent = data.jsonApi.attributes.delinquent ?? false;

    // Parse metadata if it's a string (backend stores as JSON string)
    this._metadata = data.jsonApi.attributes.metadata
      ? typeof data.jsonApi.attributes.metadata === "string"
        ? JSON.parse(data.jsonApi.attributes.metadata)
        : data.jsonApi.attributes.metadata
      : undefined;

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("BillingCustomer is managed by Stripe and cannot be created directly");
  }
}
