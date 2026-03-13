import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { AuditLogInterface } from "./audit-log.interface";

export class AuditLogService extends AbstractService {
  static async findActivityByEntity(params: {
    entityType: string;
    entityId: string;
    next?: NextRef;
  }): Promise<AuditLogInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.AuditLog,
      id: "activity",
      childEndpoint: params.entityType,
      childId: params.entityId,
    });

    return this.callApi({
      type: Modules.AuditLog,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }
}
