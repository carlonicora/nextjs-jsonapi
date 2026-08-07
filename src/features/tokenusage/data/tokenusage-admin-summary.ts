import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { TokenUsageAdminSummaryInterface } from "./tokenusage-admin-summary.interface";
import { TokenUsageAdminSummaryInput } from "./tokenusage-admin.types";

/**
 * One row of the administrative summary: a cost centre observed over one time
 * window. Six rows are returned per request — scope crossed with window — so the
 * KPI tiles can render a value and its delta without a second call.
 */
export class TokenUsageAdminSummary extends AbstractApiData implements TokenUsageAdminSummaryInterface {
  private _scope: string = "";
  private _window: string = "";
  private _cost: number = 0;
  private _credits: number = 0;
  private _tokensIn: number = 0;
  private _tokensOut: number = 0;
  private _cached: number = 0;
  private _calls: number = 0;

  get scope(): string {
    return this._scope;
  }

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
    this._scope = attrs.scope ?? "";
    this._window = attrs.window ?? "";
    this._cost = attrs.cost ?? 0;
    this._credits = attrs.credits ?? 0;
    this._tokensIn = attrs.tokensIn ?? 0;
    this._tokensOut = attrs.tokensOut ?? 0;
    this._cached = attrs.cached ?? 0;
    this._calls = attrs.calls ?? 0;

    return this;
  }

  createJsonApi(data: TokenUsageAdminSummaryInput) {
    const response: any = {
      data: {
        type: Modules.TokenUsageAdminSummary.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.scope !== undefined) response.data.attributes.scope = data.scope;
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
