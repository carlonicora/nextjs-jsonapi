import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../../core";
import { StripePriceInterface } from "../../stripe-price";
import {
  StripeSubscriptionInput,
  StripeSubscriptionInterface,
  SubscriptionStatus,
} from "./stripe-subscription.interface";

export class StripeSubscription extends AbstractApiData implements StripeSubscriptionInterface {
  private _stripeSubscriptionId?: string;
  private _status?: SubscriptionStatus;
  private _currentPeriodStart?: Date;
  private _currentPeriodEnd?: Date;
  private _cancelAtPeriodEnd: boolean = false;
  private _canceledAt?: Date;
  private _trialStart?: Date;
  private _trialEnd?: Date;
  private _price?: StripePriceInterface;

  get stripeSubscriptionId(): string {
    if (!this._stripeSubscriptionId) throw new Error("stripeSubscriptionId is not defined");
    return this._stripeSubscriptionId;
  }

  get status(): SubscriptionStatus {
    if (!this._status) throw new Error("status is not defined");
    return this._status;
  }

  get currentPeriodStart(): Date {
    if (!this._currentPeriodStart) throw new Error("currentPeriodStart is not defined");
    return this._currentPeriodStart;
  }

  get currentPeriodEnd(): Date {
    if (!this._currentPeriodEnd) throw new Error("currentPeriodEnd is not defined");
    return this._currentPeriodEnd;
  }

  get cancelAtPeriodEnd(): boolean {
    return this._cancelAtPeriodEnd;
  }

  get canceledAt(): Date | undefined {
    return this._canceledAt;
  }

  get trialStart(): Date | undefined {
    return this._trialStart;
  }

  get trialEnd(): Date | undefined {
    return this._trialEnd;
  }

  get price(): StripePriceInterface | undefined {
    return this._price;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._stripeSubscriptionId = data.jsonApi.attributes.stripeSubscriptionId;
    this._status = data.jsonApi.attributes.status;

    this._currentPeriodStart = data.jsonApi.attributes.currentPeriodStart
      ? new Date(data.jsonApi.attributes.currentPeriodStart)
      : undefined;
    this._currentPeriodEnd = data.jsonApi.attributes.currentPeriodEnd
      ? new Date(data.jsonApi.attributes.currentPeriodEnd)
      : undefined;

    this._cancelAtPeriodEnd = data.jsonApi.attributes.cancelAtPeriodEnd ?? false;
    this._canceledAt = data.jsonApi.attributes.canceledAt ? new Date(data.jsonApi.attributes.canceledAt) : undefined;

    this._trialStart = data.jsonApi.attributes.trialStart ? new Date(data.jsonApi.attributes.trialStart) : undefined;
    this._trialEnd = data.jsonApi.attributes.trialEnd ? new Date(data.jsonApi.attributes.trialEnd) : undefined;

    // Hydrate price relationship
    this._price = this._readIncluded(data, "price", Modules.StripePrice) as StripePriceInterface;

    return this;
  }

  createJsonApi(data: StripeSubscriptionInput): any {
    const response: any = {
      data: {
        type: Modules.StripeSubscription.name,
        id: data.id,
        attributes: {},
      },
    };

    if ("priceId" in data && data.priceId) {
      response.data.attributes.priceId = data.priceId;
    }
    if ("quantity" in data && data.quantity !== undefined) {
      response.data.attributes.quantity = data.quantity;
    }
    if ("trialPeriodDays" in data && data.trialPeriodDays !== undefined) {
      response.data.attributes.trialPeriodDays = data.trialPeriodDays;
    }
    if ("metadata" in data && data.metadata) {
      response.data.attributes.metadata = data.metadata;
    }

    return response;
  }
}
