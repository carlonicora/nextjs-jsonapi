import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { TokenUsageAdminBreakdownInterface } from "./tokenusage-admin-breakdown.interface";
import { TokenUsageAdminBreakdownInput } from "./tokenusage-admin.types";

/**
 * One ranked row of a breakdown. The same shape serves all three dimensions —
 * company, user and operation — which is why the three "by-X" views collapse
 * into a single `breakdown?dimension=` call.
 *
 * `activeUsers` / `monthlyCredits` / `availableMonthlyCredits` are populated only
 * for `dimension=company`; they are absent on user and operation rows.
 */
export class TokenUsageAdminBreakdown extends AbstractApiData implements TokenUsageAdminBreakdownInterface {
  private _label: string = "";
  private _sublabel?: string;
  private _cost: number = 0;
  private _credits: number = 0;
  private _tokensIn: number = 0;
  private _tokensOut: number = 0;
  private _cached: number = 0;
  private _calls: number = 0;
  private _activeUsers?: number;
  private _monthlyCredits?: number;
  private _availableMonthlyCredits?: number;

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

  get activeUsers(): number | undefined {
    return this._activeUsers;
  }

  get monthlyCredits(): number | undefined {
    return this._monthlyCredits;
  }

  get availableMonthlyCredits(): number | undefined {
    return this._availableMonthlyCredits;
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
    this._activeUsers = attrs.activeUsers ?? undefined;
    this._monthlyCredits = attrs.monthlyCredits ?? undefined;
    this._availableMonthlyCredits = attrs.availableMonthlyCredits ?? undefined;

    return this;
  }

  createJsonApi(data: TokenUsageAdminBreakdownInput) {
    const response: any = {
      data: {
        type: Modules.TokenUsageAdminBreakdown.name,
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
    if (data.activeUsers !== undefined) response.data.attributes.activeUsers = data.activeUsers;
    if (data.monthlyCredits !== undefined) response.data.attributes.monthlyCredits = data.monthlyCredits;
    if (data.availableMonthlyCredits !== undefined)
      response.data.attributes.availableMonthlyCredits = data.availableMonthlyCredits;

    return response;
  }
}
