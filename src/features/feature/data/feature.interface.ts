import { ApiDataInterface } from "../../../core";
import { ModuleInterface } from "../../module";

export interface FeatureInterface extends ApiDataInterface {
  get name(): string;
  get isProduction(): boolean;

  get modules(): ModuleInterface[];
}
