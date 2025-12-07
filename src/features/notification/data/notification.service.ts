import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { NotificationInterface } from "./notification.interface";

export class NotificationService extends AbstractService {
  static async findMany(params: { isArchived?: boolean; next?: NextRef }): Promise<NotificationInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Notification });

    if (params.isArchived) endpoint.addAdditionalParam("isArchived", "true");

    return this.callApi<NotificationInterface[]>({
      type: Modules.Notification,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async markAsRead(params: { data: any }): Promise<void> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Notification });
    await this.callApi({
      type: Modules.Notification,
      method: HttpMethod.PATCH,
      endpoint: endpoint.generate(),
      input: params.data,
      overridesJsonApiCreation: true,
    });
  }

  static async archive(params: { id: string }): Promise<void> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Notification, id: params.id, childEndpoint: "archive" });

    await this.callApi({ type: Modules.Notification, method: HttpMethod.POST, endpoint: endpoint.generate() });
  }
}
