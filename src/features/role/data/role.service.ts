import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import { RoleInput, RoleInterface } from "./role.interface";

export class RoleService extends AbstractService {
  static async findById(params: { roleId: string }): Promise<RoleInterface> {
    return this.callApi<RoleInterface>({
      type: Modules.Role,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.Role, id: params.roleId }).generate(),
    });
  }

  static async findAllRoles(params: { search?: string; next?: NextRef }): Promise<RoleInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Role });

    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi({
      type: Modules.Role,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findAllRolesByUser(params: {
    userId: string;
    search?: string;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<RoleInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.User, id: params.userId, childEndpoint: Modules.Role });

    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi({
      type: Modules.Role,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findAllRolesUserNotIn(params: {
    userId: string;
    search?: string;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<RoleInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.User,
      id: params.userId,
      childEndpoint: Modules.Role,
    }).addAdditionalParam("userNotIn", "true");

    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi({
      type: Modules.Role,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async addUserToRole(params: { userId: string; roleId: string }): Promise<void> {
    this.callApi<RoleInterface>({
      type: Modules.Role,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Role,
        id: params.roleId,
        childEndpoint: Modules.User,
        childId: params.userId,
      }).generate(),
    });
  }

  static async removeUserFromRole(params: { userId: string; roleId: string }): Promise<void> {
    this.callApi<RoleInterface>({
      type: Modules.Role,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({
        endpoint: Modules.Role,
        id: params.roleId,
        childEndpoint: Modules.User,
        childId: params.userId,
      }).generate(),
    });
  }

  static async create(params: { roleId: string; name: string; description?: string }): Promise<RoleInterface> {
    return this.callApi<RoleInterface>({
      type: Modules.Role,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.Role }).generate(),
      input: { id: params.roleId, name: params.name, description: params.description } as RoleInput,
    });
  }

  static async update(params: { roleId: string; name: string; description?: string }): Promise<RoleInterface> {
    return this.callApi<RoleInterface>({
      type: Modules.Role,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.Role, id: params.roleId }).generate(),
      input: { id: params.roleId, name: params.name, description: params.description } as RoleInput,
    });
  }

  static async delete(params: { roleId: string }): Promise<RoleInterface> {
    return this.callApi<RoleInterface>({
      type: Modules.Role,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.Role, id: params.roleId }).generate(),
    });
  }
}
