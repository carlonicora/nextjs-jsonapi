import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { PermissionMappingInterface } from "./PermissionMappingInterface";

export class PermissionMapping extends AbstractApiData implements PermissionMappingInterface {
  private _roleId?: string;
  private _moduleId?: string;
  private _permissions?: {
    create?: boolean | string;
    read?: boolean | string;
    update?: boolean | string;
    delete?: boolean | string;
  };

  get roleId(): string {
    if (!this._roleId) throw new Error("JsonApi error: permission mapping roleId is missing");
    return this._roleId;
  }

  get moduleId(): string {
    if (!this._moduleId) throw new Error("JsonApi error: permission mapping moduleId is missing");
    return this._moduleId;
  }

  get permissions(): {
    create?: boolean | string;
    read?: boolean | string;
    update?: boolean | string;
    delete?: boolean | string;
  } {
    if (!this._permissions) throw new Error("JsonApi error: permission mapping permissions is missing");
    return this._permissions;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._roleId = data.jsonApi.attributes.roleId;
    this._moduleId = data.jsonApi.attributes.moduleId;
    this._permissions = data.jsonApi.meta?.permissions;

    return this;
  }
}
