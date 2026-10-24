import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../../core";
import { StripeCouponOfferInterface } from "./stripe-coupon-offer.interface";
import { StripeCouponDiscountType, StripeCouponDurationType } from "./stripe-coupon.interface";

/** Read-only public resource: never created or updated from the frontend. */
export class StripeCouponOffer extends AbstractApiData implements StripeCouponOfferInterface {
  private _discountType?: StripeCouponDiscountType;
  private _percentOff?: number;
  private _amountOff?: number;
  private _currency?: string;
  private _duration?: StripeCouponDurationType;
  private _durationInMonths?: number;
  private _placesLeft: number = 0;
  private _placesTotal: number = 0;

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

  get placesLeft(): number {
    return this._placesLeft;
  }

  get placesTotal(): number {
    return this._placesTotal;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes;

    this._discountType = attributes.discountType;
    this._percentOff = attributes.percentOff ?? undefined;
    this._amountOff = attributes.amountOff ?? undefined;
    this._currency = attributes.currency ?? undefined;
    this._duration = attributes.duration;
    this._durationInMonths = attributes.durationInMonths ?? undefined;
    this._placesLeft = attributes.placesLeft ?? 0;
    this._placesTotal = attributes.placesTotal ?? 0;

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("StripeCouponOffer is declared by the API and is read-only");
  }
}
