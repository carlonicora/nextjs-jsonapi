import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { BlogSettingsInput, BlogSettingsInterface } from "./BlogSettingsInterface";

export class BlogSettingsService extends AbstractService {
  /**
   * GET blog-settings: the stored singleton, or the API's default.
   */
  static async get(): Promise<BlogSettingsInterface> {
    return this.callApi<BlogSettingsInterface>({
      type: Modules.BlogSettings,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogSettings }).generate(),
    });
  }

  static async save(params: BlogSettingsInput): Promise<BlogSettingsInterface> {
    return this.callApi<BlogSettingsInterface>({
      type: Modules.BlogSettings,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.BlogSettings, id: params.id }).generate(),
      input: params,
    });
  }
}
