import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { BlogCategoryInput, BlogCategoryInterface } from "./BlogCategoryInterface";

export class BlogCategoryService extends AbstractService {
  static async findMany(
    params: { search?: string; fetchAll?: boolean; next?: NextRef } = {},
  ): Promise<BlogCategoryInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.BlogCategory });

    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi<BlogCategoryInterface[]>({
      type: Modules.BlogCategory,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findOne(params: { id: string }): Promise<BlogCategoryInterface> {
    return this.callApi<BlogCategoryInterface>({
      type: Modules.BlogCategory,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogCategory, id: params.id }).generate(),
    });
  }

  static async create(params: BlogCategoryInput): Promise<BlogCategoryInterface> {
    return this.callApi<BlogCategoryInterface>({
      type: Modules.BlogCategory,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogCategory }).generate(),
      input: params,
    });
  }

  static async update(params: BlogCategoryInput): Promise<BlogCategoryInterface> {
    return this.callApi<BlogCategoryInterface>({
      type: Modules.BlogCategory,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogCategory, id: params.id }).generate(),
      input: params,
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.BlogCategory,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogCategory, id: params.id }).generate(),
    });
  }
}
