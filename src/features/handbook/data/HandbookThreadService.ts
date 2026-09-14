import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import { HandbookThread } from "./HandbookThread";
import { HandbookThreadInput, HandbookThreadInterface } from "./HandbookThreadInterface";

export class HandbookThreadService extends AbstractService {
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
  ): Promise<HandbookThreadInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.HandbookThread });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.HandbookThread.inclusions?.lists?.fields)
      endpoint.limitToFields(Modules.HandbookThread.inclusions.lists.fields);
    if (Modules.HandbookThread.inclusions?.lists?.types)
      endpoint.limitToType(Modules.HandbookThread.inclusions.lists.types);

    return this.callApi({
      type: Modules.HandbookThread,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  /** Returns the thread with its messages side-loaded — the sidebar's select. */
  static async findOne(params: { id: string }): Promise<HandbookThreadInterface> {
    return this.callApi<HandbookThreadInterface>({
      type: Modules.HandbookThread,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.HandbookThread, id: params.id }).generate(),
    });
  }

  /**
   * Opens a thread with its first question. The response is the thread (title
   * included); the messages are read back with `findOne`, because only the
   * single-resource endpoint side-loads them.
   *
   * The API answers 400 when the installation has no usable AI configuration
   * and 403 for a non-administrator; both reach the caller as a thrown error.
   *
   * `HandbookThreadInput.handbookPageId` scopes retrieval to one page. It rides
   * through the model's `createJsonApi()`, exactly as `question` does — there is
   * no `overridesJsonApiCreation` on this path.
   */
  static async create(params: HandbookThreadInput): Promise<HandbookThreadInterface> {
    return this.callApi<HandbookThreadInterface>({
      type: Modules.HandbookThread,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.HandbookThread }).generate(),
      input: params,
      suppressGlobalError: true,
    });
  }

  static async rename(params: { id: string; title: string }): Promise<void> {
    const thread = new HandbookThread();
    await this.callApi({
      type: Modules.HandbookThread,
      method: HttpMethod.PATCH,
      endpoint: new EndpointCreator({ endpoint: Modules.HandbookThread, id: params.id }).generate(),
      input: thread.createRenameJsonApi({ id: params.id, title: params.title }),
      overridesJsonApiCreation: true,
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.HandbookThread,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.HandbookThread, id: params.id }).generate(),
    });
  }
}
