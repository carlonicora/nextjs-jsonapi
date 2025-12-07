import { ApiDataInterface } from "../../../core";
import { FeatureInterface } from "../../feature";

export type RoleInput = {
  id: string;
  name: string;
  description?: string;
};

export interface RoleInterface extends ApiDataInterface {
  get name(): string;
  get description(): string;
  get isSelectable(): boolean;

  get requiredFeature(): FeatureInterface | undefined;
}
