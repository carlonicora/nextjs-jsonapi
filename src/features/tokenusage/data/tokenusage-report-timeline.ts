import { AbstractApiData, formatLocalDate, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { TokenUsageReportTimelineInterface } from "./tokenusage-report-timeline.interface";
import { TokenUsageReportTimelineInput } from "./tokenusage-report.types";

/**
 * One (bucket, series) cell of the self-service usage-over-time chart. Rows
 * arrive flat; the chart pivots them into stacked columns.
 */
export class TokenUsageReportTimeline extends AbstractApiData implements TokenUsageReportTimelineInterface {
  private _bucket: Date = new Date(0);
  private _series: string = "";
  private _cost: number = 0;
  private _credits: number = 0;
  private _tokensIn: number = 0;
  private _tokensOut: number = 0;
  private _cached: number = 0;
  private _calls: number = 0;

  get bucket(): Date {
    return this._bucket;
  }

  get series(): string {
    return this._series;
  }

  get cost(): number {
    return this._cost;
  }

  get credits(): number {
    return this._credits;
  }

  get tokensIn(): number {
    return this._tokensIn;
  }

  get tokensOut(): number {
    return this._tokensOut;
  }

  get cached(): number {
    return this._cached;
  }

  get calls(): number {
    return this._calls;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    // Wire format is "YYYY-MM-DD"; the interface promises a Date.
    this._bucket = attrs.bucket ? new Date(attrs.bucket) : new Date(0);
    this._series = attrs.series ?? "";
    this._cost = attrs.cost ?? 0;
    this._credits = attrs.credits ?? 0;
    this._tokensIn = attrs.tokensIn ?? 0;
    this._tokensOut = attrs.tokensOut ?? 0;
    this._cached = attrs.cached ?? 0;
    this._calls = attrs.calls ?? 0;

    return this;
  }

  createJsonApi(data: TokenUsageReportTimelineInput) {
    const response: any = {
      data: {
        type: Modules.TokenUsageReportTimeline.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    // `bucket` is type: "date" on the backend descriptor. formatLocalDate is
    // mandatory — passing the raw Date lets JSON.stringify call .toISOString(),
    // which UTC-shifts and can move the bucket a day. Imported from the package
    // core, never reimplemented inline.
    if (data.bucket !== undefined) response.data.attributes.bucket = formatLocalDate(data.bucket);
    if (data.series !== undefined) response.data.attributes.series = data.series;
    if (data.cost !== undefined) response.data.attributes.cost = data.cost;
    if (data.credits !== undefined) response.data.attributes.credits = data.credits;
    if (data.tokensIn !== undefined) response.data.attributes.tokensIn = data.tokensIn;
    if (data.tokensOut !== undefined) response.data.attributes.tokensOut = data.tokensOut;
    if (data.cached !== undefined) response.data.attributes.cached = data.cached;
    if (data.calls !== undefined) response.data.attributes.calls = data.calls;

    return response;
  }
}
