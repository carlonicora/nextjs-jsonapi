import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { TokenUsageReportSummaryInterface } from "./tokenusage-report-summary.interface";
import { TokenUsageReportSummaryInput } from "./tokenusage-report.types";

/**
 * One row of the self-service summary: the caller's own company observed over
 * one time window. Two rows are returned per request — "current" and the
 * equal-length "previous" span — so the KPI tiles can render a value and its
 * delta without a second call.
 *
 * There is no `scope` here: a company only ever sees itself, so the
 * customer/platform split that the administrative summary carries is absent.
 */
export class TokenUsageReportSummary extends AbstractApiData implements TokenUsageReportSummaryInterface {
  private _window: string = "";
  private _cost: number = 0;
  private _credits: number = 0;
  private _tokensIn: number = 0;
  private _tokensOut: number = 0;
  private _cached: number = 0;
  private _calls: number = 0;

  get window(): string {
    return this._window;
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
    this._window = attrs.window ?? "";
    this._cost = attrs.cost ?? 0;
    this._credits = attrs.credits ?? 0;
    this._tokensIn = attrs.tokensIn ?? 0;
    this._tokensOut = attrs.tokensOut ?? 0;
    this._cached = attrs.cached ?? 0;
    this._calls = attrs.calls ?? 0;

    return this;
  }

  createJsonApi(data: TokenUsageReportSummaryInput) {
    const response: any = {
      data: {
        type: Modules.TokenUsageReportSummary.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.window !== undefined) response.data.attributes.window = data.window;
    if (data.cost !== undefined) response.data.attributes.cost = data.cost;
    if (data.credits !== undefined) response.data.attributes.credits = data.credits;
    if (data.tokensIn !== undefined) response.data.attributes.tokensIn = data.tokensIn;
    if (data.tokensOut !== undefined) response.data.attributes.tokensOut = data.tokensOut;
    if (data.cached !== undefined) response.data.attributes.cached = data.cached;
    if (data.calls !== undefined) response.data.attributes.calls = data.calls;

    return response;
  }
}
