import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../../core";
import { StripeProductInput, StripeProductInterface } from "./stripe-product.interface";

export class StripeProduct extends AbstractApiData implements StripeProductInterface {
  private _stripeProductId?: string;
  private _name?: string;
  private _description?: string;
  private _active: boolean = true;
  private _metadata?: Record<string, any>;
  private _images: string[] = [];
  private _unitLabel?: string;

  get stripeProductId(): string {
    if (!this._stripeProductId) throw new Error("stripeProductId is not defined");
    return this._stripeProductId;
  }

  get name(): string {
    if (!this._name) throw new Error("name is not defined");
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get active(): boolean {
    return this._active;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get images(): string[] {
    return this._images;
  }

  get unitLabel(): string | undefined {
    return this._unitLabel;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._stripeProductId = data.jsonApi.attributes.stripeProductId;
    this._name = data.jsonApi.attributes.name;
    this._description = data.jsonApi.attributes.description;
    this._active = data.jsonApi.attributes.active ?? true;
    this._unitLabel = data.jsonApi.attributes.unitLabel;

    this._metadata = data.jsonApi.attributes.metadata
      ? typeof data.jsonApi.attributes.metadata === "string"
        ? JSON.parse(data.jsonApi.attributes.metadata)
        : data.jsonApi.attributes.metadata
      : undefined;

    // Images might be stored as JSON string or array
    if (data.jsonApi.attributes.images) {
      this._images =
        typeof data.jsonApi.attributes.images === "string"
          ? JSON.parse(data.jsonApi.attributes.images)
          : data.jsonApi.attributes.images;
    }

    return this;
  }

  createJsonApi(data: StripeProductInput): any {
    const response: any = {
      data: {
        type: Modules.StripeProduct.name,
        id: data.id,
        attributes: {},
      },
    };

    if (data.name) response.data.attributes.name = data.name;
    if (data.description !== undefined) response.data.attributes.description = data.description;
    if (data.active !== undefined) response.data.attributes.active = data.active;
    if (data.metadata) response.data.attributes.metadata = data.metadata;

    return response;
  }
}
