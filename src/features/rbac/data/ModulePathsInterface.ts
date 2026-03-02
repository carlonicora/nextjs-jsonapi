import { ApiDataInterface } from "../../../core";

export interface ModulePathsInterface extends ApiDataInterface {
  get moduleId(): string;
  get paths(): string[];
}
