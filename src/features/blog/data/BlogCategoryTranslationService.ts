import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { BLOG_ACTION } from "../types/blog.constants";
import { BlogCategoryTranslationInput, BlogCategoryTranslationInterface } from "./BlogCategoryTranslationInterface";

export class BlogCategoryTranslationService extends AbstractService {
  static async update(params: BlogCategoryTranslationInput): Promise<BlogCategoryTranslationInterface> {
    return this.callApi<BlogCategoryTranslationInterface>({
      type: Modules.BlogCategoryTranslation,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogCategoryTranslation, id: params.id }).generate(),
      input: params,
    });
  }

  /**
   * POST blog-category-translations/:id/retranslate. Re-queues this one
   * language from the current original. Replies 204.
   */
  static async retranslate(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.BlogCategoryTranslation,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.BlogCategoryTranslation,
        id: params.id,
        childEndpoint: BLOG_ACTION.retranslate,
      }).generate(),
    });
  }
}
