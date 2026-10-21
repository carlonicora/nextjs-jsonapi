import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import {
  EmailAutomationEnrollmentInterface,
  EmailAutomationEnrollmentStatus,
} from "./EmailAutomationEnrollmentInterface";
import { EmailAutomationInterface } from "./EmailAutomationInterface";

/** JSON:API type of the POST email-automations/unsubscribe/:token request body (not a module: nothing is stored). */
export const EMAIL_AUTOMATION_UNSUBSCRIBE_TYPE = "email-automation-unsubscribes";

export class EmailAutomationEnrollment extends AbstractApiData implements EmailAutomationEnrollmentInterface {
  private _email?: string;
  private _name?: string;
  private _status: EmailAutomationEnrollmentStatus = "active";
  private _enrolledAt?: Date;
  private _nextSendAt?: Date;
  private _finishedAt?: Date;
  private _attempts?: number;
  private _lastError?: string;
  private _currentStepSubject?: string;
  private _sentCount?: number;
  private _automation?: EmailAutomationInterface;

  get email(): string {
    return this._email ?? "";
  }

  get name(): string | undefined {
    return this._name;
  }

  get status(): EmailAutomationEnrollmentStatus {
    return this._status;
  }

  get enrolledAt(): Date {
    return this._enrolledAt ?? new Date(0);
  }

  get nextSendAt(): Date | undefined {
    return this._nextSendAt;
  }

  get finishedAt(): Date | undefined {
    return this._finishedAt;
  }

  get attempts(): number {
    return this._attempts ?? 0;
  }

  get lastError(): string | undefined {
    return this._lastError;
  }

  get currentStepSubject(): string | undefined {
    return this._currentStepSubject;
  }

  get sentCount(): number {
    return this._sentCount ?? 0;
  }

  get automation(): EmailAutomationInterface | undefined {
    return this._automation;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes;
    this._email = attributes.email;
    this._name = attributes.name ?? undefined;
    this._status = attributes.status ?? "active";
    this._enrolledAt = attributes.enrolledAt ? new Date(attributes.enrolledAt) : undefined;
    this._nextSendAt = attributes.nextSendAt ? new Date(attributes.nextSendAt) : undefined;
    this._finishedAt = attributes.finishedAt ? new Date(attributes.finishedAt) : undefined;
    this._attempts = attributes.attempts;
    this._lastError = attributes.lastError ?? undefined;
    this._currentStepSubject = attributes.currentStepSubject ?? undefined;
    this._sentCount = attributes.sentCount;

    this._automation = this._readIncluded(data, "automation", Modules.EmailAutomation) as EmailAutomationInterface;

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("EmailAutomationEnrollment is created by the API and cannot be created from the client");
  }

  /**
   * Body of POST email-automations/unsubscribe/:token.
   */
  createUnsubscribeJsonApi(params: { scope: "automation" | "all" }) {
    return {
      data: {
        type: EMAIL_AUTOMATION_UNSUBSCRIBE_TYPE,
        attributes: {
          scope: params.scope,
        },
      },
    };
  }
}
