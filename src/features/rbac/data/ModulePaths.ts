import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { ModulePathsInterface } from "./ModulePathsInterface";

export class ModulePaths extends AbstractApiData implements ModulePathsInterface {
  private _moduleId?: string;
  private _paths?: string[];

  get moduleId(): string {
    if (!this._moduleId) throw new Error("JsonApi error: module paths moduleId is missing");
    return this._moduleId;
  }

  get paths(): string[] {
    return this._paths ?? [];
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._moduleId = data.jsonApi.attributes.moduleId;
    this._paths = data.jsonApi.attributes.paths;

    return this;
  }
}
