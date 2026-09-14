import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { HandbookSectionInput } from "./HandbookSectionInput";
import { HandbookSectionInterface } from "./HandbookSectionInterface";

export class HandbookSection extends AbstractApiData implements HandbookSectionInterface {
  private _key?: string;
  private _title?: string;
  private _summary?: string;
  private _order?: string;
  private _displayTitle?: string;
  private _displaySummary?: string;

  get key(): string {
    return this._key ?? "";
  }

  get title(): string {
    return this._title ?? "";
  }

  get summary(): string | undefined {
    return this._summary;
  }

  get order(): string {
    return this._order ?? "";
  }

  get displayTitle(): string | undefined {
    return this._displayTitle;
  }

  get displaySummary(): string | undefined {
    return this._displaySummary;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._key = data.jsonApi.attributes.key;
    this._title = data.jsonApi.attributes.title;
    this._summary = data.jsonApi.attributes.summary;
    this._order = data.jsonApi.attributes.order;
    this._displayTitle = data.jsonApi.attributes.displayTitle;
    this._displaySummary = data.jsonApi.attributes.displaySummary;

    return this;
  }

  /**
   * Nothing calls this: sections are read-only over HTTP and written only by
   * the ingest. It exists because every model implements `createJsonApi()`, and
   * a model that throws on serialisation is a trap for the next writer.
   */
  createJsonApi(data: HandbookSectionInput) {
    const response: any = {
      data: {
        type: Modules.HandbookSection.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.key !== undefined) response.data.attributes.key = data.key;
    if (data.title !== undefined) response.data.attributes.title = data.title;
    if (data.summary !== undefined) response.data.attributes.summary = data.summary;
    if (data.order !== undefined) response.data.attributes.order = data.order;

    return response;
  }
}
