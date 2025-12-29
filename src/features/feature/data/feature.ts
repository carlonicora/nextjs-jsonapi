import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { ModuleInterface } from "../../module";
import { FeatureInterface } from "./feature.interface";

export class Feature extends AbstractApiData implements FeatureInterface {
  private _name?: string;
  private _isCore?: boolean;

  private _modules: ModuleInterface[] = [];

  get name(): string {
    return this._name ?? "";
  }

  get isCore(): boolean {
    return this._isCore == true ? true : false;
  }

  get modules(): ModuleInterface[] {
    return this._modules;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._name = data.jsonApi.attributes.name;
    this._isCore = data.jsonApi.attributes.isCore ?? false;

    this._modules = this._readIncluded(data, `modules`, Modules.Module) as ModuleInterface[];

    return this;
  }
}
