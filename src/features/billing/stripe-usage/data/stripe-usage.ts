import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../../core";
import { ReportUsageInput, StripeUsageInterface } from "./stripe-usage.interface";

export class StripeUsage extends AbstractApiData implements StripeUsageInterface {
  private _subscriptionId?: string;
  private _meterId?: string;
  private _meterEventName?: string;
  private _stripeEventId?: string;
  private _quantity?: number;
  private _timestamp?: Date;

  get subscriptionId(): string {
    if (!this._subscriptionId) throw new Error("subscriptionId is not defined");
    return this._subscriptionId;
  }

  get meterId(): string {
    if (!this._meterId) throw new Error("meterId is not defined");
    return this._meterId;
  }

  get meterEventName(): string {
    if (!this._meterEventName) throw new Error("meterEventName is not defined");
    return this._meterEventName;
  }

  get stripeEventId(): string {
    if (!this._stripeEventId) throw new Error("stripeEventId is not defined");
    return this._stripeEventId;
  }

  get quantity(): number {
    if (this._quantity === undefined) throw new Error("quantity is not defined");
    return this._quantity;
  }

  get timestamp(): Date | undefined {
    return this._timestamp;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._subscriptionId = data.jsonApi.attributes.subscriptionId;
    this._meterId = data.jsonApi.attributes.meterId;
    this._meterEventName = data.jsonApi.attributes.meterEventName;
    this._stripeEventId = data.jsonApi.attributes.stripeEventId;
    this._quantity = data.jsonApi.attributes.quantity;
    this._timestamp = data.jsonApi.attributes.timestamp ? new Date(data.jsonApi.attributes.timestamp) : undefined;

    return this;
  }

  createJsonApi(data: ReportUsageInput): any {
    const response: any = {
      data: {
        type: Modules.UsageRecord.name,
        attributes: {
          subscriptionItemId: data.subscriptionItemId,
          quantity: data.quantity,
        },
      },
    };

    if (data.timestamp !== undefined) response.data.attributes.timestamp = data.timestamp;
    if (data.action !== undefined) response.data.attributes.action = data.action;

    return response;
  }
}

// Backwards compatibility alias
export { StripeUsage as UsageRecord };
