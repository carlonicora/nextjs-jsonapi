import { AbstractService, HttpMethod, NextRef, PreviousRef } from "@carlonicora/nextjs-jsonapi/core";
import { EndpointCreator } from "@carlonicora/nextjs-jsonapi/core";
import { HowToInput, HowToInterface } from "@/features/essentials/how-to/data/HowToInterface";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";

export class HowToService extends AbstractService {
  static async findOne(params: { id: string }): Promise<HowToInterface> {
    return this.callApi<HowToInterface>({
      type: Modules.HowTo,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.HowTo, id: params.id }).generate(),
    });
  }

  static async findMany(params: {
    search?: string;
    fetchAll?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<HowToInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.HowTo });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.HowTo.inclusions?.lists?.fields) endpoint.limitToFields(Modules.HowTo.inclusions.lists.fields);
    if (Modules.HowTo.inclusions?.lists?.types) endpoint.limitToType(Modules.HowTo.inclusions.lists.types);

    return this.callApi({
      type: Modules.HowTo,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findManyByAuthor(params: {
    authorId: string;
    search?: string;
    fetchAll?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<HowToInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.User,
      id: params.authorId,
      childEndpoint: Modules.HowTo,
    });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.HowTo.inclusions?.lists?.fields) endpoint.limitToFields(Modules.HowTo.inclusions.lists.fields);
    if (Modules.HowTo.inclusions?.lists?.types) endpoint.limitToType(Modules.HowTo.inclusions.lists.types);

    return this.callApi({
      type: Modules.HowTo,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }
  static async create(params: HowToInput): Promise<HowToInterface> {
    return this.callApi({
      type: Modules.HowTo,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.HowTo }).generate(),
      input: params,
    });
  }

  static async update(params: HowToInput): Promise<HowToInterface> {
    return this.callApi({
      type: Modules.HowTo,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.HowTo, id: params.id }).generate(),
      input: params,
    });
  }

  static async delete(params: { howToId: string }): Promise<void> {
    await this.callApi({
      type: Modules.HowTo,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.HowTo, id: params.howToId }).generate(),
    });
  }
}
