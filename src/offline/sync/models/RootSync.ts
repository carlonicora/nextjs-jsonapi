import { AbstractApiData } from "../../../core/abstracts/AbstractApiData";
import { JsonApiHydratedDataInterface } from "../../../core/interfaces/JsonApiHydratedDataInterface";
import { RootSyncEntry, RootSyncInterface, RootSyncLink } from "./RootSyncInterface";

/**
 * Child path of the sync answer under the root module record
 * (`GET /<root endpoint>/:id/sync`), the same value as the app API's sync meta endpoint
 * (in Wyrdli, `campaignSyncMeta.endpoint`).
 */
export const ROOT_SYNC_ENDPOINT = "sync";

/** The sync answer for one root record (`root-syncs`, id = root record id). Read-only. */
export class RootSync extends AbstractApiData implements RootSyncInterface {
  private _serverTime?: Date;
  private _locked: boolean = false;
  private _lockedFrom?: Date;
  private _entries?: RootSyncEntry[];
  private _links?: RootSyncLink[];

  get serverTime(): Date {
    if (!this._serverTime) throw new Error("serverTime is not set.");
    return this._serverTime;
  }

  get locked(): boolean {
    return this._locked;
  }

  get lockedFrom(): Date | undefined {
    return this._lockedFrom;
  }

  get entries(): RootSyncEntry[] {
    return this._entries ?? [];
  }

  get links(): RootSyncLink[] {
    return this._links ?? [];
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};
    this._serverTime = attributes.serverTime ? new Date(attributes.serverTime) : undefined;
    this._locked = Boolean(attributes.locked);
    this._lockedFrom = attributes.lockedFrom ? new Date(attributes.lockedFrom) : undefined;
    this._entries = (attributes.entries ?? []).map((entry: { type: string; id: string; updatedAt: string }) => ({
      type: entry.type,
      id: entry.id,
      updatedAt: new Date(entry.updatedAt),
    }));
    this._links = (attributes.links ?? []).map((link: RootSyncLink) => ({
      fromType: link.fromType,
      fromId: link.fromId,
      toType: link.toType,
      toId: link.toId,
      kind: link.kind,
      props: link.props ?? {},
    }));

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("RootSync is read-only and cannot be created");
  }
}
