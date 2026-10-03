import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AnalyticsSummaryInterface } from "./analytics-summary.interface";
import { AnalyticsSummaryInput } from "./analytics.types";

/** One (section, window) row of the headline tiles: current or previous period. */
export class AnalyticsSummary extends AbstractApiData implements AnalyticsSummaryInterface {
  private _section: string = "";
  private _window: string = "";
  private _visitors: number = 0;
  private _sessions: number = 0;
  private _pageViews: number = 0;
  private _pagesPerSession: number = 0;
  private _consentShare: number = 0;

  get section(): string {
    return this._section;
  }

  get window(): string {
    return this._window;
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

  get pagesPerSession(): number {
    return this._pagesPerSession;
  }

  get consentShare(): number {
    return this._consentShare;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    this._section = attrs.section ?? "";
    this._window = attrs.window ?? "";
    this._visitors = attrs.visitors ?? 0;
    this._sessions = attrs.sessions ?? 0;
    this._pageViews = attrs.pageViews ?? 0;
    this._pagesPerSession = attrs.pagesPerSession ?? 0;
    this._consentShare = attrs.consentShare ?? 0;

    return this;
  }

  createJsonApi(data: AnalyticsSummaryInput) {
    const response: any = {
      data: {
        type: Modules.AnalyticsSummary.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.section !== undefined) response.data.attributes.section = data.section;
    if (data.window !== undefined) response.data.attributes.window = data.window;
    if (data.visitors !== undefined) response.data.attributes.visitors = data.visitors;
    if (data.sessions !== undefined) response.data.attributes.sessions = data.sessions;
    if (data.pageViews !== undefined) response.data.attributes.pageViews = data.pageViews;
    if (data.pagesPerSession !== undefined) response.data.attributes.pagesPerSession = data.pagesPerSession;
    if (data.consentShare !== undefined) response.data.attributes.consentShare = data.consentShare;

    return response;
  }
}
