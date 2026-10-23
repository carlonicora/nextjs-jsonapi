import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { BlogAiStatus, BlogTranslationSource } from "../types/blog.constants";
import { BlogCategoryInterface } from "./BlogCategoryInterface";
import { BlogCategoryTranslationInput, BlogCategoryTranslationInterface } from "./BlogCategoryTranslationInterface";

export class BlogCategoryTranslation extends AbstractApiData implements BlogCategoryTranslationInterface {
  private _language?: string;
  private _isOriginal?: boolean;
  private _source?: BlogTranslationSource;
  private _aiStatus?: BlogAiStatus;
  private _name?: string;
  private _slug?: string;
  private _description?: string;
  private _translatedAt?: Date;
  private _category?: BlogCategoryInterface;

  get language(): string {
    return this._language ?? "";
  }

  get isOriginal(): boolean {
    return this._isOriginal ?? false;
  }

  get source(): BlogTranslationSource {
    return this._source ?? "ai";
  }

  get aiStatus(): BlogAiStatus {
    return this._aiStatus ?? "pending";
  }

  get name(): string {
    return this._name ?? "";
  }

  get slug(): string {
    return this._slug ?? "";
  }

  get description(): string | undefined {
    return this._description;
  }

  get translatedAt(): Date | undefined {
    return this._translatedAt;
  }

  get category(): BlogCategoryInterface | undefined {
    return this._category;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};

    this._language = attributes.language;
    this._isOriginal = attributes.isOriginal === true;
    this._source = attributes.source;
    this._aiStatus = attributes.aiStatus;
    this._name = attributes.name ?? undefined;
    this._slug = attributes.slug ?? undefined;
    this._description = attributes.description ?? undefined;
    this._translatedAt = attributes.translatedAt ? new Date(attributes.translatedAt) : undefined;

    this._category = this._readIncluded(data, "category", Modules.BlogCategory) as BlogCategoryInterface;

    return this;
  }

  createJsonApi(data: BlogCategoryTranslationInput) {
    const response: any = {
      data: {
        type: Modules.BlogCategoryTranslation.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.name !== undefined) response.data.attributes.name = data.name;
    if (data.slug !== undefined) response.data.attributes.slug = data.slug;
    if (data.description !== undefined) response.data.attributes.description = data.description;

    return response;
  }
}
