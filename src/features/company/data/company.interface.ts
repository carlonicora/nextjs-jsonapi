import { ApiDataInterface } from "../../../core";
import { FeatureInterface } from "../../feature/data/feature.interface";
import { ModuleInterface } from "../../module/data/module.interface";

export type CompanyInput = {
  id: string;
  name?: string;
  logo?: string;
  configurations?: any;

  monthlyTokens?: number;
  availableMonthlyTokens?: number;
  availableExtraTokens?: number;

  featureIds?: string[];
  moduleIds?: string[];
  legal_address?: string;
  street_number?: string;
  street?: string;
  city?: string;
  province?: string;
  region?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  fiscal_data?: string;
};

export interface CompanyInterface extends ApiDataInterface {
  get name(): string;
  get configurations(): any;
  get logo(): string | undefined;
  get logoUrl(): string | undefined;

  get isActiveSubscription(): boolean;

  get monthlyTokens(): number;
  get availableMonthlyTokens(): number;
  get availableExtraTokens(): number;

  get features(): FeatureInterface[];
  get modules(): ModuleInterface[];
  get legal_address(): string | undefined;
  get street_number(): string | undefined;
  get street(): string | undefined;
  get city(): string | undefined;
  get province(): string | undefined;
  get region(): string | undefined;
  get postcode(): string | undefined;
  get country(): string | undefined;
  get country_code(): string | undefined;
  get fiscal_data(): string | undefined;
}
