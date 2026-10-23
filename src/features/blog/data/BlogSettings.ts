import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { BLOG_LIST_LAYOUTS, BlogListLayout } from "../types/blog.constants";
import { BlogSettingsInput, BlogSettingsInterface } from "./BlogSettingsInterface";

export class BlogSettings extends AbstractApiData implements BlogSettingsInterface {
  private _listLayout?: BlogListLayout;

  get listLayout(): BlogListLayout {
    return this._listLayout ?? "featured";
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const listLayout = data.jsonApi.attributes?.listLayout;
    this._listLayout = BLOG_LIST_LAYOUTS.includes(listLayout) ? listLayout : undefined;

    return this;
  }

  createJsonApi(data: BlogSettingsInput) {
    const response: any = {
      data: {
        type: Modules.BlogSettings.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    response.data.attributes.listLayout = data.listLayout;

    return response;
  }
}
