import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../../core";
import {
  StripeCouponCodeFlagsInput,
  StripeCouponCodeInput,
  StripeCouponCodeInterface,
} from "./stripe-coupon-code.interface";
import { StripeCouponInterface } from "./stripe-coupon.interface";
import { StripeCoupon } from "./stripe-coupon";

export class StripeCouponCode extends AbstractApiData implements StripeCouponCodeInterface {
  private _stripePromotionCodeId?: string;
  private _code: string = "";
  private _active: boolean = true;
  private _automatic: boolean = false;
  private _firstTimeTransaction: boolean = false;
  private _minimumAmount?: number;
  private _minimumAmountCurrency?: string;
  private _stripeCustomerId?: string;
  private _expiresAt?: Date;
  private _maxRedemptions?: number;
  private _timesRedeemed: number = 0;
  private _coupon?: StripeCouponInterface;

  get stripePromotionCodeId(): string {
    if (!this._stripePromotionCodeId) throw new Error("stripePromotionCodeId is not defined");
    return this._stripePromotionCodeId;
  }

  get code(): string {
    return this._code;
  }

  get active(): boolean {
    return this._active;
  }

  get automatic(): boolean {
    return this._automatic;
  }

  get firstTimeTransaction(): boolean {
    return this._firstTimeTransaction;
  }

  get minimumAmount(): number | undefined {
    return this._minimumAmount;
  }

  get minimumAmountCurrency(): string | undefined {
    return this._minimumAmountCurrency;
  }

  get stripeCustomerId(): string | undefined {
    return this._stripeCustomerId;
  }

  get expiresAt(): Date | undefined {
    return this._expiresAt;
  }

  get maxRedemptions(): number | undefined {
    return this._maxRedemptions;
  }

  get timesRedeemed(): number {
    return this._timesRedeemed;
  }

  get coupon(): StripeCouponInterface | undefined {
    return this._coupon;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes;

    this._stripePromotionCodeId = attributes.stripePromotionCodeId;
    this._code = attributes.code ?? "";
    this._active = attributes.active ?? true;
    this._automatic = attributes.automatic ?? false;
    this._firstTimeTransaction = attributes.firstTimeTransaction ?? false;
    this._minimumAmount = attributes.minimumAmount ?? undefined;
    this._minimumAmountCurrency = attributes.minimumAmountCurrency ?? undefined;
    this._stripeCustomerId = attributes.stripeCustomerId ?? undefined;
    this._expiresAt = attributes.expiresAt ? new Date(attributes.expiresAt) : undefined;
    this._maxRedemptions = attributes.maxRedemptions ?? undefined;
    this._timesRedeemed = attributes.timesRedeemed ?? 0;

    this._coupon = this._readIncluded(data, "coupon", Modules.StripeCoupon) as StripeCouponInterface | undefined;

    return this;
  }

  createJsonApi(data: StripeCouponCodeInput): any {
    const { id, couponId, ...code } = data;

    return {
      data: {
        type: Modules.StripeCouponCode.name,
        id,
        attributes: StripeCoupon.codeAttributes(code),
        relationships: {
          coupon: {
            data: {
              type: Modules.StripeCoupon.name,
              id: couponId,
            },
          },
        },
      },
    };
  }

  /**
   * PATCH body for the flags a code can still change after creation.
   * Only the flags that are set are sent, so switching one never touches the other.
   */
  createFlagsJsonApi(data: StripeCouponCodeFlagsInput): any {
    const attributes: Record<string, boolean> = {};
    if (data.active !== undefined) attributes.active = data.active;
    if (data.automatic !== undefined) attributes.automatic = data.automatic;

    return {
      data: {
        type: Modules.StripeCouponCode.name,
        id: data.id,
        attributes,
      },
    };
  }
}
