import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { FeatureInterface } from "../../feature";
import { ModuleInterface } from "../../module";
import { CompanyInput, CompanyInterface } from "./company.interface";

export class Company extends AbstractApiData implements CompanyInterface {
  private _name?: string;
  private _logo?: string;
  private _logoUrl?: string;
  private _configurations?: any;

  private _monthlyTokens: number = 0;
  private _availableMonthlyTokens: number = 0;
  private _availableExtraTokens: number = 0;

  private _features?: FeatureInterface[];
  private _modules?: ModuleInterface[];

  get name(): string {
    if (this._name === undefined) throw new Error("Name is not defined");
    return this._name;
  }

  get logo(): string | undefined {
    return this._logo;
  }

  get logoUrl(): string | undefined {
    return this._logoUrl;
  }

  get monthlyTokens(): number {
    return this._monthlyTokens ?? 0;
  }

  get availableMonthlyTokens(): number {
    return this._availableMonthlyTokens ?? 0;
  }

  get availableExtraTokens(): number {
    return this._availableExtraTokens ?? 0;
  }

  get features(): FeatureInterface[] {
    return this._features ?? [];
  }

  get modules(): ModuleInterface[] {
    return this._modules ?? [];
  }

  get configurations(): any | undefined {
    return this._configurations;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._name = data.jsonApi.attributes.name;
    this._configurations = data.jsonApi.attributes.configurations
      ? JSON.parse(data.jsonApi.attributes.configurations)
      : undefined;
    this._logo = data.jsonApi.attributes.logo;
    this._logoUrl = data.jsonApi.attributes.logoUrl;
    this._monthlyTokens = data.jsonApi.attributes.monthlyTokens ?? 0;
    this._availableMonthlyTokens = data.jsonApi.attributes.availableMonthlyTokens ?? 0;
    this._availableExtraTokens = data.jsonApi.attributes.availableExtraTokens ?? 0;

    this._features = this._readIncluded<FeatureInterface>(data, "features", Modules.Feature) as FeatureInterface[];
    this._modules = this._readIncluded<ModuleInterface>(data, "modules", Modules.Module) as ModuleInterface[];

    return this;
  }

  createJsonApi(data: CompanyInput) {
    const response: any = {
      data: {
        type: Modules.Company.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.name) response.data.attributes.name = data.name;
    if (data.configurations) response.data.attributes.configurations = JSON.stringify(data.configurations);
    if (data.logo) response.data.attributes.logo = data.logo;
    if (data.monthlyTokens !== undefined) response.data.attributes.monthlyTokens = data.monthlyTokens;
    if (data.availableMonthlyTokens !== undefined)
      response.data.attributes.availableMonthlyTokens = data.availableMonthlyTokens;
    if (data.availableExtraTokens !== undefined)
      response.data.attributes.availableExtraTokens = data.availableExtraTokens;

    if (data.featureIds && data.featureIds.length > 0) {
      response.data.relationships.features = {
        data: data.featureIds.map((featureId) => ({
          type: Modules.Feature.name,
          id: featureId,
        })),
      };
    }

    if (data.moduleIds && data.moduleIds.length > 0) {
      response.data.relationships.modules = {
        data: data.moduleIds.map((moduleId) => ({
          type: Modules.Module.name,
          id: moduleId,
        })),
      };
    }

    return response;
  }
}
