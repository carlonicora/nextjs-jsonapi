import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { BlogAiStatus, BlogTranslationSource } from "../types/blog.constants";
import { BlogPostInterface } from "./BlogPostInterface";
import { BlogPostTranslationInput, BlogPostTranslationInterface } from "./BlogPostTranslationInterface";

export class BlogPostTranslation extends AbstractApiData implements BlogPostTranslationInterface {
  private _language?: string;
  private _isOriginal?: boolean;
  private _source?: BlogTranslationSource;
  private _aiStatus?: BlogAiStatus;
  private _title?: string;
  private _slug?: string;
  private _summary?: string;
  private _body?: any;
  private _coverImageAlt?: string;
  private _readingMinutes?: number;
  private _translatedAt?: Date;
  private _post?: BlogPostInterface;

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

  get title(): string {
    return this._title ?? "";
  }

  get slug(): string {
    return this._slug ?? "";
  }

  get summary(): string | undefined {
    return this._summary;
  }

  get body(): any {
    return this._body ?? [];
  }

  get coverImageAlt(): string | undefined {
    return this._coverImageAlt;
  }

  get readingMinutes(): number {
    return this._readingMinutes ?? 1;
  }

  get translatedAt(): Date | undefined {
    return this._translatedAt;
  }

  get post(): BlogPostInterface | undefined {
    return this._post;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};

    this._language = attributes.language;
    this._isOriginal = attributes.isOriginal === true;
    this._source = attributes.source;
    this._aiStatus = attributes.aiStatus;
    this._title = attributes.title ?? undefined;
    this._slug = attributes.slug ?? undefined;
    this._summary = attributes.summary ?? undefined;
    this._body = attributes.body ? JSON.parse(attributes.body) : undefined;
    this._coverImageAlt = attributes.coverImageAlt ?? undefined;
    this._readingMinutes = attributes.readingMinutes ?? undefined;
    this._translatedAt = attributes.translatedAt ? new Date(attributes.translatedAt) : undefined;

    this._post = this._readIncluded(data, "post", Modules.BlogPost) as BlogPostInterface;

    return this;
  }

  createJsonApi(data: BlogPostTranslationInput) {
    const response: any = {
      data: {
        type: Modules.BlogPostTranslation.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.title !== undefined) response.data.attributes.title = data.title;
    if (data.slug !== undefined) response.data.attributes.slug = data.slug;
    if (data.summary !== undefined) response.data.attributes.summary = data.summary;
    if (data.body !== undefined) response.data.attributes.body = JSON.stringify(data.body);
    if (data.coverImageAlt !== undefined) response.data.attributes.coverImageAlt = data.coverImageAlt;

    return response;
  }
}
