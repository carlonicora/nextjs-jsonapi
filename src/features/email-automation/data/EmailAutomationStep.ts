import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { EmailAutomationInterface } from "./EmailAutomationInterface";
import { EmailAutomationStepInput, EmailAutomationStepInterface } from "./EmailAutomationStepInterface";

export class EmailAutomationStep extends AbstractApiData implements EmailAutomationStepInterface {
  private _subject?: string;
  private _body?: string;
  private _delayHours?: number;
  private _positionX?: number;
  private _positionY?: number;
  private _sentCount?: number;
  private _automation?: EmailAutomationInterface;
  private _next?: EmailAutomationStepInterface;

  get subject(): string {
    return this._subject ?? "";
  }

  get body(): string {
    return this._body ?? "";
  }

  get delayHours(): number {
    return this._delayHours ?? 0;
  }

  get positionX(): number | undefined {
    return this._positionX;
  }

  get positionY(): number | undefined {
    return this._positionY;
  }

  get sentCount(): number {
    return this._sentCount ?? 0;
  }

  get automation(): EmailAutomationInterface | undefined {
    return this._automation;
  }

  get next(): EmailAutomationStepInterface | undefined {
    return this._next;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._subject = data.jsonApi.attributes.subject;
    this._body = data.jsonApi.attributes.body;
    this._delayHours = data.jsonApi.attributes.delayHours;
    this._positionX = data.jsonApi.attributes.positionX ?? undefined;
    this._positionY = data.jsonApi.attributes.positionY ?? undefined;
    this._sentCount = data.jsonApi.attributes.sentCount;

    this._automation = this._readIncluded(data, "automation", Modules.EmailAutomation) as EmailAutomationInterface;
    this._next = this._readIncluded(data, "next", Modules.EmailAutomationStep) as EmailAutomationStepInterface;

    return this;
  }

  createJsonApi(data: EmailAutomationStepInput) {
    const response: any = {
      data: {
        type: Modules.EmailAutomationStep.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.subject !== undefined) response.data.attributes.subject = data.subject;
    if (data.body !== undefined) response.data.attributes.body = data.body;
    if (data.delayHours !== undefined) response.data.attributes.delayHours = data.delayHours;
    if (data.positionX !== undefined) response.data.attributes.positionX = data.positionX;
    if (data.positionY !== undefined) response.data.attributes.positionY = data.positionY;

    if (data.automationId) {
      response.data.relationships.automation = {
        data: {
          type: Modules.EmailAutomation.name,
          id: data.automationId,
        },
      };
    }

    return response;
  }

  /**
   * Body of POST email-automation-steps/:stepId/next: the step the chain continues to.
   */
  createNextJsonApi(params: { nextStepId: string }) {
    return {
      data: {
        type: Modules.EmailAutomationStep.name,
        id: params.nextStepId,
      },
    };
  }
}
