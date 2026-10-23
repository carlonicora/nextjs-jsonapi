import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { UserInterface } from "../../user/data/user.interface";
import { BlogPostStatus } from "../types/blog.constants";
import { BlogCategoryInterface } from "./BlogCategoryInterface";
import { BlogPostInput, BlogPostInterface } from "./BlogPostInterface";
import { BlogPostTranslationInterface } from "./BlogPostTranslationInterface";

export class BlogPost extends AbstractApiData implements BlogPostInterface {
  private _status?: BlogPostStatus;
  private _originalLanguage?: string;
  private _coverImage?: string;
  private _publishedAt?: Date;
  private _author?: UserInterface;
  private _categories?: BlogCategoryInterface[];
  private _translations?: BlogPostTranslationInterface[];

  private _language?: string;
  private _title?: string;
  private _slug?: string;
  private _summary?: string;
  private _body?: any;
  private _coverImageAlt?: string;
  private _readingMinutes?: number;
  private _authorName?: string;
  private _categoryIds?: string[];

  get status(): BlogPostStatus {
    return this._status ?? "draft";
  }

  get originalLanguage(): string {
    return this._originalLanguage ?? "";
  }

  get coverImage(): string | undefined {
    return this._coverImage;
  }

  get publishedAt(): Date | undefined {
    return this._publishedAt;
  }

  get author(): UserInterface | undefined {
    return this._author;
  }

  get categories(): BlogCategoryInterface[] {
    return this._categories ?? [];
  }

  get translations(): BlogPostTranslationInterface[] {
    return this._translations ?? [];
  }

  get original(): BlogPostTranslationInterface | undefined {
    return this.translations.find((translation) => translation.isOriginal);
  }

  get language(): string | undefined {
    return this._language;
  }

  get title(): string | undefined {
    return this._title;
  }

  get slug(): string | undefined {
    return this._slug;
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

  get readingMinutes(): number | undefined {
    return this._readingMinutes;
  }

  get authorName(): string | undefined {
    return this._authorName;
  }

  get categoryIds(): string[] {
    return this._categoryIds ?? [];
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};
    const meta = data.jsonApi.meta ?? {};
    // The resolved-language values are computed on the API. Depending on the
    // descriptor they arrive as attributes or as meta, so both are read.
    const resolved = (key: string) => attributes[key] ?? meta[key] ?? undefined;

    this._status = attributes.status;
    this._originalLanguage = attributes.originalLanguage;
    this._coverImage = attributes.coverImage ?? undefined;
    this._publishedAt = attributes.publishedAt ? new Date(attributes.publishedAt) : undefined;

    this._language = resolved("language");
    this._title = resolved("title");
    this._slug = resolved("slug");
    this._summary = resolved("summary");
    const body = resolved("body");
    this._body = body ? JSON.parse(body) : undefined;
    this._coverImageAlt = resolved("coverImageAlt");
    this._readingMinutes = resolved("readingMinutes");
    this._authorName = resolved("authorName");
    this._categoryIds = resolved("categoryIds") ?? [];

    this._author = this._readIncluded(data, "author", Modules.User) as UserInterface;
    this._categories = this._readIncluded(data, "categories", Modules.BlogCategory) as BlogCategoryInterface[];
    this._translations = this._readIncluded(
      data,
      "translations",
      Modules.BlogPostTranslation,
    ) as BlogPostTranslationInterface[];

    return this;
  }

  createJsonApi(data: BlogPostInput) {
    const response: any = {
      data: {
        type: Modules.BlogPost.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.originalLanguage !== undefined) response.data.attributes.originalLanguage = data.originalLanguage;
    if (data.title !== undefined) response.data.attributes.title = data.title;
    if (data.slug !== undefined) response.data.attributes.slug = data.slug;
    if (data.summary !== undefined) response.data.attributes.summary = data.summary;
    if (data.body !== undefined) response.data.attributes.body = JSON.stringify(data.body);
    if (data.coverImage !== undefined) response.data.attributes.coverImage = data.coverImage;
    if (data.coverImageAlt !== undefined) response.data.attributes.coverImageAlt = data.coverImageAlt;

    if (data.categoryIds !== undefined) {
      response.data.relationships.categories = {
        data: data.categoryIds.map((id) => ({ type: Modules.BlogCategory.name, id })),
      };
    }

    return response;
  }
}
