import { AbstractApiData, formatLocalDate, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AnalyticsTimelineInterface } from "./analytics-timeline.interface";
import { AnalyticsTimelineInput } from "./analytics.types";

/** One (bucket, section) point of the visitors-over-time chart. */
export class AnalyticsTimeline extends AbstractApiData implements AnalyticsTimelineInterface {
  private _bucket: Date = new Date(0);
  private _section: string = "";
  private _visitors: number = 0;
  private _sessions: number = 0;
  private _pageViews: number = 0;

  get bucket(): Date {
    return this._bucket;
  }

  get section(): string {
    return this._section;
  }

  get visitors(): number {
    return this._visitors;
  }

  get sessions(): number {
    return this._sessions;
  }

  get pageViews(): number {
    return this._pageViews;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    // Wire format is "YYYY-MM-DD"; the interface promises a Date.
    this._bucket = attrs.bucket ? new Date(attrs.bucket) : new Date(0);
    this._section = attrs.section ?? "";
    this._visitors = attrs.visitors ?? 0;
    this._sessions = attrs.sessions ?? 0;
    this._pageViews = attrs.pageViews ?? 0;

    return this;
  }

  createJsonApi(data: AnalyticsTimelineInput) {
    const response: any = {
      data: {
        type: Modules.AnalyticsTimeline.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    // `bucket` is type: "date" on the backend descriptor: formatLocalDate, never the raw Date.
    if (data.bucket !== undefined) response.data.attributes.bucket = formatLocalDate(data.bucket);
    if (data.section !== undefined) response.data.attributes.section = data.section;
    if (data.visitors !== undefined) response.data.attributes.visitors = data.visitors;
    if (data.sessions !== undefined) response.data.attributes.sessions = data.sessions;
    if (data.pageViews !== undefined) response.data.attributes.pageViews = data.pageViews;

    return response;
  }
}
