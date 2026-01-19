import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../../core";
import { PromotionCodeValidationResult } from "./stripe-promotion-code.interface";

export class StripePromotionCode extends AbstractApiData implements PromotionCodeValidationResult {
  private _valid: boolean = false;
  private _promotionCodeId?: string;
  private _code: string = "";
  private _discountType?: "percent_off" | "amount_off";
  private _discountValue?: number;
  private _currency?: string;
  private _duration?: "forever" | "once" | "repeating";
  private _durationInMonths?: number;
  private _errorMessage?: string;

  get valid(): boolean {
    return this._valid;
  }

  get promotionCodeId(): string | undefined {
    return this._promotionCodeId;
  }

  get code(): string {
    return this._code;
  }

  get discountType(): "percent_off" | "amount_off" | undefined {
    return this._discountType;
  }

  get discountValue(): number | undefined {
    return this._discountValue;
  }

  get currency(): string | undefined {
    return this._currency;
  }

  get duration(): "forever" | "once" | "repeating" | undefined {
    return this._duration;
  }

  get durationInMonths(): number | undefined {
    return this._durationInMonths;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._valid = data.jsonApi.attributes.valid ?? false;
    this._promotionCodeId = data.jsonApi.attributes.promotionCodeId;
    this._code = data.jsonApi.attributes.code ?? "";
    this._discountType = data.jsonApi.attributes.discountType;
    this._discountValue = data.jsonApi.attributes.discountValue;
    this._currency = data.jsonApi.attributes.currency;
    this._duration = data.jsonApi.attributes.duration;
    this._durationInMonths = data.jsonApi.attributes.durationInMonths;
    this._errorMessage = data.jsonApi.attributes.errorMessage;

    return this;
  }
}
