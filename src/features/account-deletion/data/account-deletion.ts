import { v4 } from "uuid";
import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AccountDeletionInput, AccountDeletionInterface } from "./account-deletion.interface";

export class AccountDeletion extends AbstractApiData implements AccountDeletionInterface {
  private _requestedAt?: Date;
  private _scheduledAt?: Date;
  private _hasDeliverableEmail: boolean = false;
  private _hasActiveSubscription: boolean = false;
  private _deletesCompany: boolean = false;
  private _ownedCount: number = 0;
  private _otherTables?: string[];

  get requestedAt(): Date | undefined {
    return this._requestedAt;
  }

  get scheduledAt(): Date | undefined {
    return this._scheduledAt;
  }

  get hasDeliverableEmail(): boolean {
    return this._hasDeliverableEmail;
  }

  get hasActiveSubscription(): boolean {
    return this._hasActiveSubscription;
  }

  get deletesCompany(): boolean {
    return this._deletesCompany;
  }

  get ownedCount(): number {
    return this._ownedCount;
  }

  get otherTables(): string[] {
    return this._otherTables ?? [];
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};

    this._requestedAt = attributes.requestedAt ? new Date(attributes.requestedAt) : undefined;
    this._scheduledAt = attributes.scheduledAt ? new Date(attributes.scheduledAt) : undefined;
    this._hasDeliverableEmail = attributes.hasDeliverableEmail === true;
    this._hasActiveSubscription = attributes.hasActiveSubscription === true;
    this._deletesCompany = attributes.deletesCompany === true;
    this._ownedCount = typeof attributes.ownedCount === "number" ? attributes.ownedCount : 0;
    this._otherTables = Array.isArray(attributes.otherTables) ? attributes.otherTables : [];

    return this;
  }

  createJsonApi(data: AccountDeletionInput) {
    const response: any = {
      data: {
        type: Modules.AccountDeletion.name,
        id: data.id,
        attributes: {
          confirmation: data.confirmation,
        },
        meta: {},
        relationships: {},
      },
      included: [],
    };

    return response;
  }

  /**
   * Body of the public "Keep my account" call. The caller is not signed in and
   * has no id to send: the API validates a client UUID and ignores its value.
   */
  createKeepJsonApi(params: { token: string }) {
    return {
      data: {
        type: Modules.AccountDeletion.name,
        id: v4(),
        attributes: {
          token: params.token,
        },
      },
    };
  }
}
