import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { BLOG_ACTION } from "../types/blog.constants";
import { BlogPostInput, BlogPostInterface } from "./BlogPostInterface";

export class BlogPostService extends AbstractService {
  static async findMany(params: { search?: string; next?: NextRef } = {}): Promise<BlogPostInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.BlogPost });

    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi<BlogPostInterface[]>({
      type: Modules.BlogPost,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findOne(params: { id: string }): Promise<BlogPostInterface> {
    return this.callApi<BlogPostInterface>({
      type: Modules.BlogPost,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogPost, id: params.id }).generate(),
    });
  }

  static async create(params: BlogPostInput): Promise<BlogPostInterface> {
    return this.callApi<BlogPostInterface>({
      type: Modules.BlogPost,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogPost }).generate(),
      input: params,
    });
  }

  static async update(params: BlogPostInput): Promise<BlogPostInterface> {
    return this.callApi<BlogPostInterface>({
      type: Modules.BlogPost,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogPost, id: params.id }).generate(),
      input: params,
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.BlogPost,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogPost, id: params.id }).generate(),
    });
  }

  /**
   * POST blog-posts/:id/publish. Sends no body; replies with the post.
   */
  static async publish(params: { id: string }): Promise<BlogPostInterface> {
    return this.callApi<BlogPostInterface>({
      type: Modules.BlogPost,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.BlogPost,
        id: params.id,
        childEndpoint: BLOG_ACTION.publish,
      }).generate(),
    });
  }

  /**
   * POST blog-posts/:id/unpublish. Sends no body; replies with the post.
   */
  static async unpublish(params: { id: string }): Promise<BlogPostInterface> {
    return this.callApi<BlogPostInterface>({
      type: Modules.BlogPost,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.BlogPost,
        id: params.id,
        childEndpoint: BLOG_ACTION.unpublish,
      }).generate(),
    });
  }
}
