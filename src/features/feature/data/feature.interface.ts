import { ApiDataInterface } from "../../../core";
import { ModuleInterface } from "../../module";

export interface FeatureInterface extends ApiDataInterface {
  get name(): string;
  get isCore(): boolean;

  get modules(): ModuleInterface[];
}
