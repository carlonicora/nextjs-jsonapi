import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AnalyticsBreakdownInterface } from "./analytics-breakdown.interface";
import { AnalyticsBreakdownInput } from "./analytics.types";

/** One row of a breakdown table: a key (source, route, …) and its counts. */
export class AnalyticsBreakdown extends AbstractApiData implements AnalyticsBreakdownInterface {
  private _dimension: string = "";
  private _key: string = "";
  private _visitors: number = 0;
  private _sessions: number = 0;
  private _pageViews: number = 0;

  get dimension(): string {
    return this._dimension;
  }

  get key(): string {
    return this._key;
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
    this._dimension = attrs.dimension ?? "";
    this._key = attrs.key ?? "";
    this._visitors = attrs.visitors ?? 0;
    this._sessions = attrs.sessions ?? 0;
    this._pageViews = attrs.pageViews ?? 0;

    return this;
  }

  createJsonApi(data: AnalyticsBreakdownInput) {
    const response: any = {
      data: {
        type: Modules.AnalyticsBreakdown.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.dimension !== undefined) response.data.attributes.dimension = data.dimension;
    if (data.key !== undefined) response.data.attributes.key = data.key;
    if (data.visitors !== undefined) response.data.attributes.visitors = data.visitors;
    if (data.sessions !== undefined) response.data.attributes.sessions = data.sessions;
    if (data.pageViews !== undefined) response.data.attributes.pageViews = data.pageViews;

    return response;
  }
}
