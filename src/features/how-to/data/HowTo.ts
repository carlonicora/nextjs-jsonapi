import { JsonApiHydratedDataInterface, Modules } from "../../../core";
import { Content } from "../../content/data/content";
import { HowToInput, HowToInterface } from "./HowToInterface";

export class HowTo extends Content implements HowToInterface {
  private _description?: any;
  private _pages?: string;
  private _helpContentSlug?: string;

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

  get helpContentSlug(): string | undefined {
    return this._helpContentSlug;
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
    this._helpContentSlug = data.jsonApi.attributes.helpContentSlug;

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

    return response;
  }
}
