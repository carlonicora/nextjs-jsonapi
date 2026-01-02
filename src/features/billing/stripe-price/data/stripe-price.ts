import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../../core";
import { StripeProductInterface } from "../../stripe-product";
import { PriceRecurring, StripePriceInput, StripePriceInterface } from "./stripe-price.interface";

export class StripePrice extends AbstractApiData implements StripePriceInterface {
  private _stripePriceId?: string;
  private _productId?: string;
  private _product?: StripeProductInterface;
  private _active: boolean = true;
  private _currency?: string;
  private _unitAmount?: number;
  private _recurring?: PriceRecurring;
  private _priceType?: "one_time" | "recurring";
  private _nickname?: string;
  private _lookupKey?: string;
  private _metadata?: Record<string, any>;
  private _description?: string;
  private _features?: string[];

  get stripePriceId(): string {
    if (!this._stripePriceId) throw new Error("stripePriceId is not defined");
    return this._stripePriceId;
  }

  get productId(): string {
    if (!this._productId) throw new Error("productId is not defined");
    return this._productId;
  }

  get product(): StripeProductInterface | undefined {
    return this._product;
  }

  get active(): boolean {
    return this._active;
  }

  get currency(): string {
    if (!this._currency) throw new Error("currency is not defined");
    return this._currency;
  }

  get unitAmount(): number | undefined {
    return this._unitAmount;
  }

  get recurring(): PriceRecurring | undefined {
    return this._recurring;
  }

  get priceType(): "one_time" | "recurring" {
    if (!this._priceType) throw new Error("priceType is not defined");
    return this._priceType;
  }

  get nickname(): string | undefined {
    return this._nickname;
  }

  get lookupKey(): string | undefined {
    return this._lookupKey;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get description(): string | undefined {
    return this._description;
  }

  get features(): string[] | undefined {
    return this._features;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._stripePriceId = data.jsonApi.attributes.stripePriceId;
    this._productId = data.jsonApi.attributes.productId;
    this._active = data.jsonApi.attributes.active ?? true;
    this._currency = data.jsonApi.attributes.currency;
    this._unitAmount = data.jsonApi.attributes.unitAmount;
    this._priceType = data.jsonApi.attributes.priceType;

    // Construct recurring object from flat attributes
    if (data.jsonApi.attributes.recurringInterval) {
      this._recurring = {
        interval: data.jsonApi.attributes.recurringInterval,
        intervalCount: data.jsonApi.attributes.recurringIntervalCount ?? 1,
        usageType: data.jsonApi.attributes.recurringUsageType,
      };
    }

    this._nickname = data.jsonApi.attributes.nickname;
    this._lookupKey = data.jsonApi.attributes.lookupKey;

    this._metadata = data.jsonApi.attributes.metadata
      ? typeof data.jsonApi.attributes.metadata === "string"
        ? JSON.parse(data.jsonApi.attributes.metadata)
        : data.jsonApi.attributes.metadata
      : undefined;

    this._description = data.jsonApi.attributes.description;
    this._features = data.jsonApi.attributes.features
      ? typeof data.jsonApi.attributes.features === "string"
        ? JSON.parse(data.jsonApi.attributes.features)
        : data.jsonApi.attributes.features
      : undefined;

    // Hydrate product relationship
    this._product = this._readIncluded(data, "product", Modules.StripeProduct) as StripeProductInterface;

    return this;
  }

  createJsonApi(data: StripePriceInput): any {
    const response: any = {
      data: {
        type: Modules.StripePrice.name,
        id: data.id,
        attributes: {},
      },
    };

    if ("productId" in data && data.productId) {
      response.data.attributes.productId = data.productId;
    }
    if ("currency" in data && data.currency) {
      response.data.attributes.currency = data.currency;
    }
    if ("unitAmount" in data && data.unitAmount !== undefined) {
      response.data.attributes.unitAmount = data.unitAmount;
    }
    if ("active" in data && data.active !== undefined) {
      response.data.attributes.active = data.active;
    }
    if ("nickname" in data && data.nickname !== undefined) {
      response.data.attributes.nickname = data.nickname;
    }
    if ("metadata" in data && data.metadata) {
      response.data.attributes.metadata = data.metadata;
    }
    if ("recurring" in data && data.recurring) {
      response.data.attributes.recurring = data.recurring;
    }
    if ("description" in data && data.description !== undefined) {
      response.data.attributes.description = data.description;
    }
    if ("features" in data && data.features !== undefined) {
      response.data.attributes.features = JSON.stringify(data.features);
    }

    return response;
  }
}
