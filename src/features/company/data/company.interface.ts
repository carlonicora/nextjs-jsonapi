import { ApiDataInterface } from "../../../core";
import { FeatureInterface } from "../../feature/data/feature.interface";
import { ModuleInterface } from "../../module/data/module.interface";

export type CompanyInput = {
  id: string;
  name?: string;
  logo?: string;
  configurations?: any;

  monthlyCredits?: number;
  availableMonthlyCredits?: number;
  availableExtraCredits?: number;
  aiEnabled?: boolean;

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

  get monthlyCredits(): number;
  get availableMonthlyCredits(): number;
  get availableExtraCredits(): number;

  /**
   * Whether this company's plan carries AI. Non-optional: `rehydrate()`
   * defaults an absent attribute to `true`, so the getter always has a value.
   */
  get aiEnabled(): boolean;

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
