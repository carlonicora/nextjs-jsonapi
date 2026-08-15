import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { TokenUsageReportBreakdownInterface } from "./tokenusage-report-breakdown.interface";
import { TokenUsageReportBreakdownInput } from "./tokenusage-report.types";

/**
 * One ranked row of a self-service breakdown. The same shape serves both
 * dimensions — operation and target — which is why the two "by-X" panels
 * collapse into a single `breakdown?dimension=` call.
 *
 * Deliberately narrower than the administrative row: no `activeUsers`,
 * `monthlyCredits` or `availableMonthlyCredits`, which are company-fleet
 * figures a single company has no business seeing.
 */
export class TokenUsageReportBreakdown extends AbstractApiData implements TokenUsageReportBreakdownInterface {
  private _label: string = "";
  private _sublabel?: string;
  private _cost: number = 0;
  private _credits: number = 0;
  private _tokensIn: number = 0;
  private _tokensOut: number = 0;
  private _cached: number = 0;
  private _calls: number = 0;

  get label(): string {
    return this._label;
  }

  get sublabel(): string | undefined {
    return this._sublabel;
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
    this._label = attrs.label ?? "";
    this._sublabel = attrs.sublabel ?? undefined;
    this._cost = attrs.cost ?? 0;
    this._credits = attrs.credits ?? 0;
    this._tokensIn = attrs.tokensIn ?? 0;
    this._tokensOut = attrs.tokensOut ?? 0;
    this._cached = attrs.cached ?? 0;
    this._calls = attrs.calls ?? 0;

    return this;
  }

  createJsonApi(data: TokenUsageReportBreakdownInput) {
    const response: any = {
      data: {
        type: Modules.TokenUsageReportBreakdown.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.label !== undefined) response.data.attributes.label = data.label;
    if (data.sublabel !== undefined) response.data.attributes.sublabel = data.sublabel;
    if (data.cost !== undefined) response.data.attributes.cost = data.cost;
    if (data.credits !== undefined) response.data.attributes.credits = data.credits;
    if (data.tokensIn !== undefined) response.data.attributes.tokensIn = data.tokensIn;
    if (data.tokensOut !== undefined) response.data.attributes.tokensOut = data.tokensOut;
    if (data.cached !== undefined) response.data.attributes.cached = data.cached;
    if (data.calls !== undefined) response.data.attributes.calls = data.calls;

    return response;
  }
}
