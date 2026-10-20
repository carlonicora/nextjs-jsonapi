import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { WaitlistInput, WaitlistInterface, WaitlistStatus } from "./WaitlistInterface";

export class Waitlist extends AbstractApiData implements WaitlistInterface {
  private _email?: string;
  private _gdprConsent: boolean = false;
  private _gdprConsentAt?: string;
  private _marketingConsent?: boolean;
  private _marketingConsentAt?: string;
  private _questionnaire?: Record<string, any>;
  private _status: WaitlistStatus = "pending";
  private _confirmedAt?: string;
  private _invitedAt?: string;
  private _registeredAt?: string;
  private _sourceRef?: string;
  private _sourceUtmSource?: string;
  private _sourceUtmMedium?: string;
  private _sourceUtmCampaign?: string;
  private _sourceReferrer?: string;
  private _sourceLandingPath?: string;

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

  get questionnaire(): Record<string, any> | undefined {
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

  get sourceRef(): string | undefined {
    return this._sourceRef;
  }

  get sourceUtmSource(): string | undefined {
    return this._sourceUtmSource;
  }

  get sourceUtmMedium(): string | undefined {
    return this._sourceUtmMedium;
  }

  get sourceUtmCampaign(): string | undefined {
    return this._sourceUtmCampaign;
  }

  get sourceReferrer(): string | undefined {
    return this._sourceReferrer;
  }

  get sourceLandingPath(): string | undefined {
    return this._sourceLandingPath;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._email = data.jsonApi.attributes.email;
    this._gdprConsent = data.jsonApi.attributes.gdprConsent;
    this._gdprConsentAt = data.jsonApi.attributes.gdprConsentAt;
    this._marketingConsent = data.jsonApi.attributes.marketingConsent;
    this._marketingConsentAt = data.jsonApi.attributes.marketingConsentAt;
    // The API's descriptor transform parses the stored JSON string into an object
    const questionnaire = data.jsonApi.attributes.questionnaire;
    this._questionnaire = questionnaire && typeof questionnaire === "object" ? questionnaire : undefined;
    this._status = data.jsonApi.attributes.status;
    this._confirmedAt = data.jsonApi.attributes.confirmedAt;
    this._invitedAt = data.jsonApi.attributes.invitedAt;
    this._registeredAt = data.jsonApi.attributes.registeredAt;
    this._sourceRef = data.jsonApi.attributes.sourceRef;
    this._sourceUtmSource = data.jsonApi.attributes.sourceUtmSource;
    this._sourceUtmMedium = data.jsonApi.attributes.sourceUtmMedium;
    this._sourceUtmCampaign = data.jsonApi.attributes.sourceUtmCampaign;
    this._sourceReferrer = data.jsonApi.attributes.sourceReferrer;
    this._sourceLandingPath = data.jsonApi.attributes.sourceLandingPath;

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

    if (data.source !== undefined) {
      const attributes = response.data.attributes;
      if (data.source.sourceRef !== undefined) attributes.sourceRef = data.source.sourceRef;
      if (data.source.sourceUtmSource !== undefined) attributes.sourceUtmSource = data.source.sourceUtmSource;
      if (data.source.sourceUtmMedium !== undefined) attributes.sourceUtmMedium = data.source.sourceUtmMedium;
      if (data.source.sourceUtmCampaign !== undefined) attributes.sourceUtmCampaign = data.source.sourceUtmCampaign;
      if (data.source.sourceReferrer !== undefined) attributes.sourceReferrer = data.source.sourceReferrer;
      if (data.source.sourceLandingPath !== undefined) attributes.sourceLandingPath = data.source.sourceLandingPath;
    }

    return response;
  }
}
