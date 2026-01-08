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
};

export interface CompanyInterface extends ApiDataInterface {
  get name(): string;
  get configurations(): any;
  get logo(): string | undefined;
  get logoUrl(): string | undefined;

  get monthlyTokens(): number;
  get availableMonthlyTokens(): number;
  get availableExtraTokens(): number;

  get features(): FeatureInterface[];
  get modules(): ModuleInterface[];
}
