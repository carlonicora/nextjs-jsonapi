import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { BLOG_ACTION } from "../types/blog.constants";
import { BlogPostTranslationInput, BlogPostTranslationInterface } from "./BlogPostTranslationInterface";

export class BlogPostTranslationService extends AbstractService {
  static async update(params: BlogPostTranslationInput): Promise<BlogPostTranslationInterface> {
    return this.callApi<BlogPostTranslationInterface>({
      type: Modules.BlogPostTranslation,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogPostTranslation, id: params.id }).generate(),
      input: params,
    });
  }

  /**
   * POST blog-post-translations/:id/retranslate. Re-queues this one language
   * from the current original. Replies 204.
   */
  static async retranslate(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.BlogPostTranslation,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.BlogPostTranslation,
        id: params.id,
        childEndpoint: BLOG_ACTION.retranslate,
      }).generate(),
    });
  }
}
