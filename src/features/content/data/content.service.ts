import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import { ContentInterface } from "./content.interface";

export class ContentService extends AbstractService {
  static async findMany(params: {
    contentIds?: string[];
    search?: string;
    fetchAll?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<ContentInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Content });

    if (params.contentIds) {
      endpoint.addAdditionalParam("contentIds", params.contentIds.join(","));
      endpoint.addAdditionalParam("fetchAll", "true");
    } else {
      if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
      if (params.search) endpoint.addAdditionalParam("search", params.search);
    }
    if (Modules.Content.inclusions?.lists?.fields) endpoint.limitToFields(Modules.Content.inclusions.lists.fields);
    if (Modules.Content.inclusions?.lists?.types) endpoint.limitToType(Modules.Content.inclusions.lists.types);

    return this.callApi({
      type: Modules.Content,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findRelevant(params: { id: string; next?: NextRef; prev?: PreviousRef }): Promise<ContentInterface[]> {
    const endpoint: EndpointCreator = new EndpointCreator({
      endpoint: Modules.Content,
      id: params.id,
      childEndpoint: "relevance",
    });

    if (Modules.Content.inclusions?.lists?.fields) endpoint.limitToFields(Modules.Content.inclusions.lists.fields);
    if (Modules.Content.inclusions?.lists?.types) endpoint.limitToType(Modules.Content.inclusions.lists.types);

    return this.callApi<ContentInterface[]>({
      type: Modules.Content,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findManyByAuthor(params: {
    userId: string;
    search?: string;
    fetchAll?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<ContentInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Author,
      id: params.userId,
      childEndpoint: Modules.Content,
    });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.Content.inclusions?.lists?.fields) endpoint.limitToFields(Modules.Content.inclusions.lists.fields);
    if (Modules.Content.inclusions?.lists?.types) endpoint.limitToType(Modules.Content.inclusions.lists.types);

    return this.callApi({
      type: Modules.Content,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }
}
