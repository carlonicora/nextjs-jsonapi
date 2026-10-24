import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../../core";
import { StripeCouponCodeInput, StripeCouponCodeInterface } from "./stripe-coupon-code.interface";
import {
  StripeCouponDiscountType,
  StripeCouponDurationType,
  StripeCouponInput,
  StripeCouponInterface,
  StripeCouponRenameInput,
} from "./stripe-coupon.interface";

export class StripeCoupon extends AbstractApiData implements StripeCouponInterface {
  private _stripeCouponId?: string;
  private _name?: string;
  private _discountType?: StripeCouponDiscountType;
  private _percentOff?: number;
  private _amountOff?: number;
  private _currency?: string;
  private _duration?: StripeCouponDurationType;
  private _durationInMonths?: number;
  private _stripeProductIds: string[] = [];
  private _redeemBy?: Date;
  private _maxRedemptions?: number;
  private _timesRedeemed: number = 0;
  private _valid: boolean = true;
  private _codes: StripeCouponCodeInterface[] = [];

  get stripeCouponId(): string {
    if (!this._stripeCouponId) throw new Error("stripeCouponId is not defined");
    return this._stripeCouponId;
  }

  get name(): string {
    return this._name ?? "";
  }

  get discountType(): StripeCouponDiscountType {
    if (!this._discountType) throw new Error("discountType is not defined");
    return this._discountType;
  }

  get percentOff(): number | undefined {
    return this._percentOff;
  }

  get amountOff(): number | undefined {
    return this._amountOff;
  }

  get currency(): string | undefined {
    return this._currency;
  }

  get duration(): StripeCouponDurationType {
    if (!this._duration) throw new Error("duration is not defined");
    return this._duration;
  }

  get durationInMonths(): number | undefined {
    return this._durationInMonths;
  }

  get stripeProductIds(): string[] {
    return this._stripeProductIds;
  }

  get redeemBy(): Date | undefined {
    return this._redeemBy;
  }

  get maxRedemptions(): number | undefined {
    return this._maxRedemptions;
  }

  get timesRedeemed(): number {
    return this._timesRedeemed;
  }

  get valid(): boolean {
    return this._valid;
  }

  get codes(): StripeCouponCodeInterface[] {
    return this._codes;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes;

    this._stripeCouponId = attributes.stripeCouponId;
    this._name = attributes.name;
    this._discountType = attributes.discountType;
    this._percentOff = attributes.percentOff ?? undefined;
    this._amountOff = attributes.amountOff ?? undefined;
    this._currency = attributes.currency ?? undefined;
    this._duration = attributes.duration;
    this._durationInMonths = attributes.durationInMonths ?? undefined;
    this._stripeProductIds = attributes.stripeProductIds ?? [];
    this._redeemBy = attributes.redeemBy ? new Date(attributes.redeemBy) : undefined;
    this._maxRedemptions = attributes.maxRedemptions ?? undefined;
    this._timesRedeemed = attributes.timesRedeemed ?? 0;
    this._valid = attributes.valid ?? true;

    this._codes =
      (this._readIncluded(data, "codes", Modules.StripeCouponCode) as StripeCouponCodeInterface[] | undefined) ?? [];

    return this;
  }

  createJsonApi(data: StripeCouponInput): any {
    const response: any = {
      data: {
        type: Modules.StripeCoupon.name,
        id: data.id,
        attributes: {
          name: data.name,
          discountType: data.discountType,
          duration: data.duration,
          firstCode: StripeCoupon.codeAttributes(data.firstCode),
        },
      },
    };

    const attributes = response.data.attributes;
    if (data.stripeCouponId) attributes.stripeCouponId = data.stripeCouponId;
    if (data.discountType === "percent_off") attributes.percentOff = data.percentOff;
    else {
      attributes.amountOff = data.amountOff;
      attributes.currency = data.currency;
    }
    if (data.duration === "repeating") attributes.durationInMonths = data.durationInMonths;
    if (data.productIds && data.productIds.length > 0) attributes.productIds = data.productIds;
    if (data.redeemBy !== undefined) attributes.redeemBy = data.redeemBy.toISOString();
    if (data.maxRedemptions !== undefined) attributes.maxRedemptions = data.maxRedemptions;

    return response;
  }

  /**
   * Rename is the only change Stripe allows on a coupon after creation.
   * Dedicated method so the service never needs a generic override.
   */
  createRenameJsonApi(data: StripeCouponRenameInput): any {
    return {
      data: {
        type: Modules.StripeCoupon.name,
        id: data.id,
        attributes: { name: data.name },
      },
    };
  }

  /** Attributes of a code, shared by the coupon's first code and StripeCouponCode.createJsonApi. */
  static codeAttributes(code: Omit<StripeCouponCodeInput, "id" | "couponId">): Record<string, any> {
    const attributes: Record<string, any> = {};
    if (code.code) attributes.code = code.code;
    if (code.firstTimeTransaction !== undefined) attributes.firstTimeTransaction = code.firstTimeTransaction;
    if (code.minimumAmount !== undefined) attributes.minimumAmount = code.minimumAmount;
    if (code.minimumAmountCurrency) attributes.minimumAmountCurrency = code.minimumAmountCurrency;
    if (code.stripeCustomerId) attributes.stripeCustomerId = code.stripeCustomerId;
    if (code.expiresAt !== undefined) attributes.expiresAt = code.expiresAt.toISOString();
    if (code.maxRedemptions !== undefined) attributes.maxRedemptions = code.maxRedemptions;
    if (code.automatic !== undefined) attributes.automatic = code.automatic;
    return attributes;
  }
}
