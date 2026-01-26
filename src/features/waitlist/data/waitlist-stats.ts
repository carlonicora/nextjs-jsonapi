import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { WaitlistStatsInterface } from "./waitlist-stats.interface";

export class WaitlistStats extends AbstractApiData implements WaitlistStatsInterface {
  private _pending: number = 0;
  private _confirmed: number = 0;
  private _invited: number = 0;
  private _registered: number = 0;
  private _total: number = 0;

  get pending(): number {
    return this._pending;
  }

  get confirmed(): number {
    return this._confirmed;
  }

  get invited(): number {
    return this._invited;
  }

  get registered(): number {
    return this._registered;
  }

  get total(): number {
    return this._total;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    this._pending = attrs.pending ?? 0;
    this._confirmed = attrs.confirmed ?? 0;
    this._invited = attrs.invited ?? 0;
    this._registered = attrs.registered ?? 0;
    this._total = attrs.total ?? 0;

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("WaitlistStats is read-only and cannot be created");
  }
}
