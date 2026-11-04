import { AbstractApiData, formatLocalDate, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AnalyticsDailyUniqueTimelineInterface } from "./analytics-daily-unique-timeline.interface";
import { AnalyticsDailyUniqueTimelineInput } from "./analytics.types";

/** One day of the daily unique visitors / users charts. A null count is an unknown day, never 0. */
export class AnalyticsDailyUniqueTimeline extends AbstractApiData implements AnalyticsDailyUniqueTimelineInterface {
  private _day: Date = new Date(0);
  private _visitors: number | null = null;
  private _users: number | null = null;

  get day(): Date {
    return this._day;
  }

  get visitors(): number | null {
    return this._visitors;
  }

  get users(): number | null {
    return this._users;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    // Wire format is "YYYY-MM-DD" (always present); the interface promises a Date.
    this._day = new Date(attrs.day);
    this._visitors = attrs.visitors ?? null;
    this._users = attrs.users ?? null;

    return this;
  }

  createJsonApi(data: AnalyticsDailyUniqueTimelineInput) {
    const response: any = {
      data: {
        type: Modules.AnalyticsDailyUniqueTimeline.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    // `day` is type: "date" on the backend descriptor: formatLocalDate, never the raw Date.
    if (data.day !== undefined) response.data.attributes.day = formatLocalDate(data.day);
    if (data.visitors !== undefined) response.data.attributes.visitors = data.visitors;
    if (data.users !== undefined) response.data.attributes.users = data.users;

    return response;
  }
}
