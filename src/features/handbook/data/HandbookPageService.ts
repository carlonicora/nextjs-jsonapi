import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import { HandbookPageInterface } from "./HandbookPageInterface";

export class HandbookPageService extends AbstractService {
  /**
   * `next` / `prev` are not optional extras: `useDataListRetriever` drives
   * pagination by handing the cursor back here, so a findMany that drops them
   * renders exactly one page and no navigation, however many rows exist.
   * Mirrors HowToService.findMany.
   */
  static async findMany(
    params: {
      search?: string;
      fetchAll?: boolean;
      next?: NextRef;
      prev?: PreviousRef;
    } = {},
  ): Promise<HandbookPageInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.HandbookPage });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.HandbookPage.inclusions?.lists?.fields)
      endpoint.limitToFields(Modules.HandbookPage.inclusions.lists.fields);
    if (Modules.HandbookPage.inclusions?.lists?.types)
      endpoint.limitToType(Modules.HandbookPage.inclusions.lists.types);

    return this.callApi({
      type: Modules.HandbookPage,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findOne(params: { id: string }): Promise<HandbookPageInterface> {
    return this.callApi<HandbookPageInterface>({
      type: Modules.HandbookPage,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.HandbookPage, id: params.id }).generate(),
    });
  }

  /** POST /handbookpages/sync — replies 204; the caller refetches the list. */
  static async sync(): Promise<void> {
    await this.callApi({
      type: Modules.HandbookPage,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.HandbookPage, id: "sync" }).generate(),
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.HandbookPage,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.HandbookPage, id: params.id }).generate(),
    });
  }
}
