import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { ModuleInterface } from "./module.interface";

export class Module extends AbstractApiData implements ModuleInterface {
  private _name?: string;
  private _permissions?: {
    create: boolean | string;
    read: boolean | string;
    update: boolean | string;
    delete: boolean | string;
  };

  get name(): string {
    if (!this._name) throw new Error("Name is not defined");
    return this._name ?? "";
  }

  get permissions(): {
    create: boolean | string;
    read: boolean | string;
    update: boolean | string;
    delete: boolean | string;
  } {
    if (!this._permissions) throw new Error("Permissions is not defined");
    return this._permissions;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._name = data.jsonApi.attributes.name;
    this._permissions = data.jsonApi.meta.permissions;

    return this;
  }
}
