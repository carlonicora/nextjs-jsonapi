import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { TwoFactorChallengeInterface } from "./two-factor-challenge.interface";

export type TwoFactorChallengeInput = {
  id: string;
  method: "totp" | "passkey" | "backup";
};

export class TwoFactorChallenge extends AbstractApiData implements TwoFactorChallengeInterface {
  private _pendingToken: string = "";
  private _availableMethods: ("totp" | "passkey" | "backup")[] = [];
  private _expiresAt: Date = new Date();

  get pendingToken(): string {
    return this._pendingToken;
  }

  get availableMethods(): ("totp" | "passkey" | "backup")[] {
    return this._availableMethods;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._pendingToken = data.jsonApi.attributes.pendingToken ?? "";
    this._availableMethods = data.jsonApi.attributes.availableMethods ?? [];
    this._expiresAt = data.jsonApi.attributes.expiresAt ? new Date(data.jsonApi.attributes.expiresAt) : new Date();
    return this;
  }

  createJsonApi(data: TwoFactorChallengeInput) {
    return {
      data: {
        type: "two-factor-configs",
        id: data.id,
        attributes: {
          method: data.method,
        },
      },
    };
  }
}
