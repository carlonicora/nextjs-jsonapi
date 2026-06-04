import { JsonApiHydratedDataInterface, Modules } from "../../../core";
import { Content } from "../../content/data/content";
import { HowToInput, HowToInterface } from "./HowToInterface";

export class HowTo extends Content implements HowToInterface {
  private _description?: any;
  private _pages?: string;
  private _howToType?: string;
  private _slug?: string;
  private _order?: number;
  private _summary?: string;
  private _tags?: string[];
  private _contextualKeys?: string[];
  private _draft?: boolean;

  /**
   * Parse pages from backend JSON string (handles legacy single string + JSON array)
   */
  static parsePagesFromString(pagesStr?: string): string[] {
    if (!pagesStr) return [];
    try {
      const parsed = JSON.parse(pagesStr);
      return Array.isArray(parsed) ? parsed : [pagesStr];
    } catch {
      // Legacy: treat as single page if not valid JSON
      return pagesStr ? [pagesStr] : [];
    }
  }

  /**
   * Serialize pages array to JSON string for backend
   */
  static serializePagesToString(pages: string[]): string | undefined {
    const filtered = pages.filter((p) => p.trim());
    return filtered.length > 0 ? JSON.stringify(filtered) : undefined;
  }

  get description(): any {
    return this._description;
  }

  get pages(): string | undefined {
    return this._pages;
  }

  get howToType(): string | undefined {
    return this._howToType;
  }

  get slug(): string | undefined {
    return this._slug;
  }

  get order(): number | undefined {
    return this._order;
  }

  get summary(): string | undefined {
    return this._summary;
  }

  get tags(): string[] {
    return this._tags ?? [];
  }

  get contextualKeys(): string[] {
    return this._contextualKeys ?? [];
  }

  get draft(): boolean {
    return this._draft ?? false;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const rawDescription = data.jsonApi.attributes.description;
    if (rawDescription === undefined || rawDescription === null || rawDescription === "") {
      this._description = undefined;
    } else if (typeof rawDescription === "string") {
      try {
        this._description = JSON.parse(rawDescription);
      } catch {
        // Help-content HowTos store plain-text summaries; admin-created HowTos
        // store JSON-stringified BlockNote docs. Fall back to the raw string
        // rather than crashing rehydration for the plain-text case.
        this._description = rawDescription;
      }
    } else {
      this._description = rawDescription;
    }
    this._pages = data.jsonApi.attributes.pages;
    this._howToType = data.jsonApi.attributes.howToType;
    this._slug = data.jsonApi.attributes.slug;
    this._order = data.jsonApi.attributes.order;
    this._summary = data.jsonApi.attributes.summary;
    this._tags = data.jsonApi.attributes.tags ?? [];
    this._contextualKeys = data.jsonApi.attributes.contextualKeys ?? [];
    this._draft = data.jsonApi.attributes.draft ?? false;

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

    if (data.description !== undefined) response.data.attributes.description = JSON.stringify(data.description);
    if (data.pages !== undefined) response.data.attributes.pages = data.pages;
    if (data.howToType !== undefined) response.data.attributes.howToType = data.howToType;
    if (data.slug !== undefined) response.data.attributes.slug = data.slug;
    if (data.order !== undefined) response.data.attributes.order = data.order;
    if (data.summary !== undefined) response.data.attributes.summary = data.summary;
    if (data.tags !== undefined) response.data.attributes.tags = data.tags;
    if (data.contextualKeys !== undefined) response.data.attributes.contextualKeys = data.contextualKeys;
    if (data.draft !== undefined) response.data.attributes.draft = data.draft;

    return response;
  }
}
