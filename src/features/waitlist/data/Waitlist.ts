import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { WaitlistInput, WaitlistInterface, WaitlistStatus } from "./WaitlistInterface";

export class Waitlist extends AbstractApiData implements WaitlistInterface {
  private _email?: string;
  private _gdprConsent: boolean = false;
  private _gdprConsentAt?: string;
  private _marketingConsent?: boolean;
  private _marketingConsentAt?: string;
  private _questionnaire?: string;
  private _status: WaitlistStatus = "pending";
  private _confirmedAt?: string;
  private _invitedAt?: string;
  private _registeredAt?: string;

  get email(): string {
    return this._email ?? "";
  }

  get gdprConsent(): boolean {
    return this._gdprConsent;
  }

  get gdprConsentAt(): string {
    return this._gdprConsentAt ?? "";
  }

  get marketingConsent(): boolean | undefined {
    return this._marketingConsent;
  }

  get marketingConsentAt(): string | undefined {
    return this._marketingConsentAt;
  }

  get questionnaire(): string | undefined {
    return this._questionnaire;
  }

  get status(): WaitlistStatus {
    return this._status;
  }

  get confirmedAt(): string | undefined {
    return this._confirmedAt;
  }

  get invitedAt(): string | undefined {
    return this._invitedAt;
  }

  get registeredAt(): string | undefined {
    return this._registeredAt;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._email = data.jsonApi.attributes.email;
    this._gdprConsent = data.jsonApi.attributes.gdprConsent;
    this._gdprConsentAt = data.jsonApi.attributes.gdprConsentAt;
    this._marketingConsent = data.jsonApi.attributes.marketingConsent;
    this._marketingConsentAt = data.jsonApi.attributes.marketingConsentAt;
    this._questionnaire = data.jsonApi.attributes.questionnaire;
    this._status = data.jsonApi.attributes.status;
    this._confirmedAt = data.jsonApi.attributes.confirmedAt;
    this._invitedAt = data.jsonApi.attributes.invitedAt;
    this._registeredAt = data.jsonApi.attributes.registeredAt;

    return this;
  }

  createJsonApi(data: WaitlistInput) {
    const response: any = {
      data: {
        type: Modules.Waitlist.name,
        id: data.id,
        attributes: {
          email: data.email,
          gdprConsent: data.gdprConsent,
          gdprConsentAt: data.gdprConsentAt,
        },
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.marketingConsent !== undefined) {
      response.data.attributes.marketingConsent = data.marketingConsent;
    }

    if (data.marketingConsentAt !== undefined) {
      response.data.attributes.marketingConsentAt = data.marketingConsentAt;
    }

    // JSON.stringify questionnaire for backend storage
    if (data.questionnaire !== undefined) {
      response.data.attributes.questionnaire = JSON.stringify(data.questionnaire);
    }

    return response;
  }
}
