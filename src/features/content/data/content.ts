import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { SearchResultInterface } from "../../search/interfaces/search.result.interface";
import { UserInterface } from "../../user";
import { ContentInput, ContentInterface } from "./content.interface";

export class Content extends AbstractApiData implements ContentInterface, SearchResultInterface {
  private _contentType?: string;

  private _name?: string;
  private _abstract?: string;
  private _tldr?: string;
  private _aiStatus?: string;
  private _relevance?: number;

  private _author?: UserInterface;
  private _editors?: UserInterface[];

  get searchResult(): string {
    return this._name ?? "";
  }

  get contentType(): string | undefined {
    return this._contentType;
  }

  get name(): string {
    if (this._name === undefined) throw new Error("JsonApi error: content name is missing");
    return this._name;
  }

  get abstract(): string | undefined {
    return this._abstract;
  }

  get tldr(): string | undefined {
    return this._tldr;
  }

  get aiStatus(): string {
    return this._aiStatus ?? "";
  }

  get relevance(): number | undefined {
    return this._relevance;
  }

  get author(): UserInterface {
    if (this._author === undefined) throw new Error("JsonApi error: document author is missing");
    return this._author;
  }

  get editors(): UserInterface[] {
    return this._editors ?? [];
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._contentType = data.jsonApi.meta.contentType;

    this._name = data.jsonApi.attributes.name;
    this._abstract = data.jsonApi.attributes.abstract;
    this._tldr = data.jsonApi.attributes.tldr;
    this._aiStatus = data.jsonApi.meta.aiStatus;
    this._relevance = data.jsonApi.meta.relevance;

    this._author = this._readIncluded(data, "author", Modules.User) as UserInterface;
    this._editors = this._readIncluded(data, "editors", Modules.User) as UserInterface[];

    return this;
  }

  protected addContentInput(response: any, data: ContentInput) {
    if (data.name) response.data.attributes.name = data.name;

    if (data.authorId) {
      response.data.relationships.author = {
        data: {
          type: Modules.User.name,
          id: data.authorId,
        },
      };
    }
  }
}
