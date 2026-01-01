import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../../core";
import { PaymentMethodInterface } from "./payment-method.interface";

/**
 * PaymentMethod class for JSON:API rehydration
 *
 * Transforms flat JSON:API attributes into the nested PaymentMethodInterface structure
 * expected by the frontend components.
 */
export class PaymentMethod extends AbstractApiData implements PaymentMethodInterface {
  private _paymentType?: string;
  private _card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  private _billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postalCode?: string;
      state?: string;
    };
  };

  get type(): string {
    if (!this._paymentType) throw new Error("type is not defined");
    return this._paymentType;
  }

  get card():
    | {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
      }
    | undefined {
    return this._card;
  }

  get billingDetails():
    | {
        name?: string;
        email?: string;
        phone?: string;
        address?: {
          city?: string;
          country?: string;
          line1?: string;
          line2?: string;
          postalCode?: string;
          state?: string;
        };
      }
    | undefined {
    return this._billingDetails;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;

    this._paymentType = attrs.type;

    // Build card object from flat attributes
    if (attrs.brand || attrs.last4 || attrs.expMonth || attrs.expYear) {
      this._card = {
        brand: attrs.brand,
        last4: attrs.last4,
        expMonth: attrs.expMonth,
        expYear: attrs.expYear,
      };
    }

    // Build billingDetails object from flat attributes
    const hasAddress =
      attrs.billingAddressCity ||
      attrs.billingAddressCountry ||
      attrs.billingAddressLine1 ||
      attrs.billingAddressLine2 ||
      attrs.billingAddressPostalCode ||
      attrs.billingAddressState;

    const hasBillingDetails = attrs.billingName || attrs.billingEmail || attrs.billingPhone || hasAddress;

    if (hasBillingDetails) {
      this._billingDetails = {
        name: attrs.billingName ?? undefined,
        email: attrs.billingEmail ?? undefined,
        phone: attrs.billingPhone ?? undefined,
      };

      if (hasAddress) {
        this._billingDetails.address = {
          city: attrs.billingAddressCity ?? undefined,
          country: attrs.billingAddressCountry ?? undefined,
          line1: attrs.billingAddressLine1 ?? undefined,
          line2: attrs.billingAddressLine2 ?? undefined,
          postalCode: attrs.billingAddressPostalCode ?? undefined,
          state: attrs.billingAddressState ?? undefined,
        };
      }
    }

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("PaymentMethod is managed by Stripe and cannot be created directly");
  }
}
