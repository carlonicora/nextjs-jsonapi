import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { FeatureInterface } from "../../feature";
import { RoleInput, RoleInterface } from "./role.interface";

export class Role extends AbstractApiData implements RoleInterface {
  private _name?: string;
  private _description?: string;
  private _isSelectable?: boolean;

  private _requiredFeature?: FeatureInterface;

  get name(): string {
    if (!this._name) throw new Error("Name is not defined");
    return this._name;
  }

  get description(): string {
    return this._description ?? "";
  }

  get isSelectable(): boolean {
    return this._isSelectable ?? false;
  }

  get requiredFeature(): FeatureInterface | undefined {
    return this._requiredFeature;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._name = data.jsonApi.attributes.name ?? undefined;
    this._description = data.jsonApi.attributes.description ?? undefined;
    this._isSelectable = data.jsonApi.attributes.isSelectable ?? undefined;

    this._requiredFeature = this._readIncluded<FeatureInterface>(
      data,
      "requiredFeature",
      Modules.Feature,
    ) as FeatureInterface;

    return this;
  }

  createJsonApi(data: RoleInput) {
    const response: any = {
      data: {
        type: Modules.Role.name,
        id: data.id,
        attributes: {
          name: data.name,
        },
        meta: {},
      },
      included: [],
    };

    if (data.description !== undefined) response.data.attributes.description = data.description;

    return response;
  }
}
