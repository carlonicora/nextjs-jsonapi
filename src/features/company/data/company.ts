import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { FeatureInterface } from "../../feature";
import { ModuleInterface } from "../../module";
import { CompanyInput, CompanyInterface } from "./company.interface";

export class Company extends AbstractApiData implements CompanyInterface {
  private _name?: string;
  private _logo?: string;
  private _logoUrl?: string;
  private _configurations?: any;

  private _isActiveSubscription: boolean = false;

  private _monthlyCredits: number = 0;
  private _availableMonthlyCredits: number = 0;
  private _availableExtraCredits: number = 0;
  private _aiEnabled?: boolean;

  private _features?: FeatureInterface[];
  private _modules?: ModuleInterface[];

  private _legal_address?: string;
  private _street_number?: string;
  private _street?: string;
  private _city?: string;
  private _province?: string;
  private _region?: string;
  private _postcode?: string;
  private _country?: string;
  private _country_code?: string;
  private _fiscal_data?: string;

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

  get isActiveSubscription(): boolean {
    return this._isActiveSubscription ?? false;
  }

  get monthlyCredits(): number {
    return this._monthlyCredits ?? 0;
  }

  get availableMonthlyCredits(): number {
    return this._availableMonthlyCredits ?? 0;
  }

  get availableExtraCredits(): number {
    return this._availableExtraCredits ?? 0;
  }

  get aiEnabled(): boolean {
    return this._aiEnabled ?? true;
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

  get legal_address(): string | undefined {
    return this._legal_address;
  }

  get street_number(): string | undefined {
    return this._street_number;
  }

  get street(): string | undefined {
    return this._street;
  }

  get city(): string | undefined {
    return this._city;
  }

  get province(): string | undefined {
    return this._province;
  }

  get region(): string | undefined {
    return this._region;
  }

  get postcode(): string | undefined {
    return this._postcode;
  }

  get country(): string | undefined {
    return this._country;
  }

  get country_code(): string | undefined {
    return this._country_code;
  }

  get fiscal_data(): string | undefined {
    return this._fiscal_data;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._name = data.jsonApi.attributes.name;
    this._configurations = data.jsonApi.attributes.configurations
      ? JSON.parse(data.jsonApi.attributes.configurations)
      : undefined;
    this._logo = data.jsonApi.attributes.logo;
    this._logoUrl = data.jsonApi.attributes.logoUrl;
    this._isActiveSubscription = data.jsonApi.attributes.isActiveSubscription ?? false;
    this._monthlyCredits = data.jsonApi.attributes.monthlyCredits ?? 0;
    this._availableMonthlyCredits = data.jsonApi.attributes.availableMonthlyCredits ?? 0;
    this._availableExtraCredits = data.jsonApi.attributes.availableExtraCredits ?? 0;
    this._aiEnabled = data.jsonApi.attributes.aiEnabled ?? true;

    this._legal_address = data.jsonApi.attributes.legal_address;
    this._street_number = data.jsonApi.attributes.street_number;
    this._street = data.jsonApi.attributes.street;
    this._city = data.jsonApi.attributes.city;
    this._province = data.jsonApi.attributes.province;
    this._region = data.jsonApi.attributes.region;
    this._postcode = data.jsonApi.attributes.postcode;
    this._country = data.jsonApi.attributes.country;
    this._country_code = data.jsonApi.attributes.country_code;
    this._fiscal_data = data.jsonApi.attributes.fiscal_data;

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
    if (data.monthlyCredits !== undefined) response.data.attributes.monthlyCredits = data.monthlyCredits;
    if (data.availableMonthlyCredits !== undefined)
      response.data.attributes.availableMonthlyCredits = data.availableMonthlyCredits;
    if (data.availableExtraCredits !== undefined)
      response.data.attributes.availableExtraCredits = data.availableExtraCredits;
    if (data.aiEnabled !== undefined) response.data.attributes.aiEnabled = data.aiEnabled;

    if (data.legal_address !== undefined) response.data.attributes.legal_address = data.legal_address;
    if (data.street_number !== undefined) response.data.attributes.street_number = data.street_number;
    if (data.street !== undefined) response.data.attributes.street = data.street;
    if (data.city !== undefined) response.data.attributes.city = data.city;
    if (data.province !== undefined) response.data.attributes.province = data.province;
    if (data.region !== undefined) response.data.attributes.region = data.region;
    if (data.postcode !== undefined) response.data.attributes.postcode = data.postcode;
    if (data.country !== undefined) response.data.attributes.country = data.country;
    if (data.country_code !== undefined) response.data.attributes.country_code = data.country_code;
    if (data.fiscal_data !== undefined) response.data.attributes.fiscal_data = data.fiscal_data;

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
