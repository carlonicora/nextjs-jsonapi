import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { BlogCategoryInput, BlogCategoryInterface } from "./BlogCategoryInterface";
import { BlogCategoryTranslationInterface } from "./BlogCategoryTranslationInterface";

export class BlogCategory extends AbstractApiData implements BlogCategoryInterface {
  private _originalLanguage?: string;
  private _image?: string;
  private _translations?: BlogCategoryTranslationInterface[];

  private _language?: string;
  private _name?: string;
  private _slug?: string;
  private _description?: string;

  get originalLanguage(): string {
    return this._originalLanguage ?? "";
  }

  get image(): string | undefined {
    return this._image;
  }

  get translations(): BlogCategoryTranslationInterface[] {
    return this._translations ?? [];
  }

  get original(): BlogCategoryTranslationInterface | undefined {
    return this.translations.find((translation) => translation.isOriginal);
  }

  get language(): string | undefined {
    return this._language;
  }

  get name(): string | undefined {
    return this._name;
  }

  get slug(): string | undefined {
    return this._slug;
  }

  get description(): string | undefined {
    return this._description;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};
    const meta = data.jsonApi.meta ?? {};
    // The resolved-language values are computed on the API. Depending on the
    // descriptor they arrive as attributes or as meta, so both are read.
    const resolved = (key: string) => attributes[key] ?? meta[key] ?? undefined;

    this._originalLanguage = attributes.originalLanguage;
    this._image = attributes.image ?? undefined;

    this._language = resolved("language");
    this._name = resolved("name");
    this._slug = resolved("slug");
    this._description = resolved("description");

    this._translations = this._readIncluded(
      data,
      "translations",
      Modules.BlogCategoryTranslation,
    ) as BlogCategoryTranslationInterface[];

    return this;
  }

  createJsonApi(data: BlogCategoryInput) {
    const response: any = {
      data: {
        type: Modules.BlogCategory.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.originalLanguage !== undefined) response.data.attributes.originalLanguage = data.originalLanguage;
    if (data.name !== undefined) response.data.attributes.name = data.name;
    if (data.slug !== undefined) response.data.attributes.slug = data.slug;
    if (data.description !== undefined) response.data.attributes.description = data.description;
    if (data.image !== undefined) response.data.attributes.image = data.image;

    return response;
  }
}
