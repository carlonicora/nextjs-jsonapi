import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { HandbookPageInput } from "./HandbookPageInput";
import { HandbookPageInterface } from "./HandbookPageInterface";

export class HandbookPage extends AbstractApiData implements HandbookPageInterface {
  private _path?: string;
  private _title?: string;
  private _content?: string;
  private _contentHash?: string;
  private _wordCount?: number;
  private _aiStatus?: string;
  private _section?: string;
  private _order?: string;
  private _summary?: string;
  private _displayTitle?: string;
  private _displaySummary?: string;
  private _displayContent?: string;

  get path(): string {
    return this._path ?? "";
  }

  get title(): string {
    return this._title ?? "";
  }

  get content(): string {
    return this._content ?? "";
  }

  get contentHash(): string {
    return this._contentHash ?? "";
  }

  get wordCount(): number {
    return this._wordCount ?? 0;
  }

  get aiStatus(): string | undefined {
    return this._aiStatus;
  }

  get section(): string {
    return this._section ?? "";
  }

  get order(): string {
    return this._order ?? "";
  }

  get summary(): string | undefined {
    return this._summary;
  }

  get displayTitle(): string | undefined {
    return this._displayTitle;
  }

  get displaySummary(): string | undefined {
    return this._displaySummary;
  }

  get displayContent(): string | undefined {
    return this._displayContent;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._path = data.jsonApi.attributes.path;
    this._title = data.jsonApi.attributes.title;
    this._content = data.jsonApi.attributes.content;
    this._contentHash = data.jsonApi.attributes.contentHash;
    this._wordCount = data.jsonApi.attributes.wordCount;
    this._aiStatus = data.jsonApi.attributes.aiStatus;
    this._section = data.jsonApi.attributes.section;
    this._order = data.jsonApi.attributes.order;
    this._summary = data.jsonApi.attributes.summary;
    this._displayTitle = data.jsonApi.attributes.displayTitle;
    this._displaySummary = data.jsonApi.attributes.displaySummary;
    this._displayContent = data.jsonApi.attributes.displayContent;

    return this;
  }

  createJsonApi(data: HandbookPageInput) {
    const response: any = {
      data: {
        type: Modules.HandbookPage.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    return response;
  }
}
