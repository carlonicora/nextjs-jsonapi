import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { EmailAutomationInput, EmailAutomationInterface } from "./EmailAutomationInterface";

export class EmailAutomation extends AbstractApiData implements EmailAutomationInterface {
  private _name?: string;
  private _trigger?: string;
  private _exitTrigger?: string;
  private _replyTo?: string;
  private _isActive: boolean = false;
  private _stepCount?: number;
  private _activeCount?: number;
  private _completedCount?: number;
  private _unsubscribedCount?: number;

  get name(): string {
    return this._name ?? "";
  }

  get trigger(): string | undefined {
    return this._trigger;
  }

  get exitTrigger(): string | undefined {
    return this._exitTrigger;
  }

  get replyTo(): string | undefined {
    return this._replyTo;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get stepCount(): number {
    return this._stepCount ?? 0;
  }

  get activeCount(): number {
    return this._activeCount ?? 0;
  }

  get completedCount(): number {
    return this._completedCount ?? 0;
  }

  get unsubscribedCount(): number {
    return this._unsubscribedCount ?? 0;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._name = data.jsonApi.attributes.name;
    this._trigger = data.jsonApi.attributes.trigger ?? undefined;
    this._exitTrigger = data.jsonApi.attributes.exitTrigger ?? undefined;
    this._replyTo = data.jsonApi.attributes.replyTo ?? undefined;
    this._isActive = data.jsonApi.attributes.isActive === true;
    this._stepCount = data.jsonApi.attributes.stepCount;
    this._activeCount = data.jsonApi.attributes.activeCount;
    this._completedCount = data.jsonApi.attributes.completedCount;
    this._unsubscribedCount = data.jsonApi.attributes.unsubscribedCount;

    return this;
  }

  createJsonApi(data: EmailAutomationInput) {
    const response: any = {
      data: {
        type: Modules.EmailAutomation.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.name !== undefined) response.data.attributes.name = data.name;
    if (data.trigger !== undefined) response.data.attributes.trigger = data.trigger;
    if (data.exitTrigger !== undefined) response.data.attributes.exitTrigger = data.exitTrigger;
    if (data.replyTo !== undefined) response.data.attributes.replyTo = data.replyTo;
    if (data.isActive !== undefined) response.data.attributes.isActive = data.isActive;

    return response;
  }
}
