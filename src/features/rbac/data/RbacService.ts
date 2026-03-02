import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { FeatureInterface } from "../../feature";
import { RoleInterface } from "../../role";
import { PermissionMappingInterface } from "./PermissionMappingInterface";
import { ModulePathsInterface } from "./ModulePathsInterface";

export class RbacService extends AbstractService {
  static async getFeatures(): Promise<FeatureInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Feature }).addAdditionalParam("fetchAll", "true");

    return this.callApi<FeatureInterface[]>({
      type: Modules.Feature,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getRoles(): Promise<RoleInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Role }).addAdditionalParam("fetchAll", "true");

    return this.callApi<RoleInterface[]>({
      type: Modules.Role,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getPermissionMappings(): Promise<PermissionMappingInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.PermissionMapping });

    return this.callApi<PermissionMappingInterface[]>({
      type: Modules.PermissionMapping,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async getModuleRelationshipPaths(): Promise<ModulePathsInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.ModulePaths });

    return this.callApi<ModulePathsInterface[]>({
      type: Modules.ModulePaths,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
