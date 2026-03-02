import { ApiDataInterface } from "../../../core";

export interface PermissionMappingInterface extends ApiDataInterface {
  get roleId(): string;
  get moduleId(): string;
  get permissions(): {
    create?: boolean | string;
    read?: boolean | string;
    update?: boolean | string;
    delete?: boolean | string;
  };
}
