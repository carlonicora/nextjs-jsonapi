import { HowToInput, HowToInterface } from "@/features/essentials/how-to/data/HowToInterface";
import { UserInterface } from "@carlonicora/nextjs-jsonapi/core";
import { Content } from "@/features/content/data/Content";
import { JsonApiHydratedDataInterface, Modules } from "@carlonicora/nextjs-jsonapi/core";

export class HowTo extends Content implements HowToInterface {
  private _description?: string;
  private _pages?: string;
  private _aiStatus?: string;

  get description(): string {
    return this._description ?? "";
  }

  get pages(): string {
    return this._pages ?? "";
  }

  get aiStatus(): string {
    return this._aiStatus ?? "";
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._description = data.jsonApi.attributes.description;
    this._pages = data.jsonApi.attributes.pages;
    this._aiStatus = data.jsonApi.attributes.aiStatus;

    return this;
  }

  createJsonApi(data: HowToInput) {
    const response: any = {
      data: {
        type: Modules.HowTo.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    super.addContentInput(response, data);

    if (data.description !== undefined) response.data.attributes.description = data.description;
    if (data.pages !== undefined) response.data.attributes.pages = data.pages;
    if (data.aiStatus !== undefined) response.data.attributes.aiStatus = data.aiStatus;

    if (data.authorId) {
      response.data.relationships.author = {
        data: {
          type: Modules.User.name,
          id: data.authorId,
        },
      };
    }

    return response;
  }
}
