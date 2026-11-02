import { ApiDataInterface } from "../../../core/interfaces/ApiDataInterface";

export type RootSyncEntry = { type: string; id: string; updatedAt: Date };

export type RootSyncLink = {
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  kind: string;
  props: Record<string, unknown>;
};

export interface RootSyncInterface extends ApiDataInterface {
  get serverTime(): Date;
  get locked(): boolean;
  get lockedFrom(): Date | undefined;
  get entries(): RootSyncEntry[];
  get links(): RootSyncLink[];
}
