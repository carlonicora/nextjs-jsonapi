import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { EmailAutomationTriggerInterface } from "./EmailAutomationTriggerInterface";

export class EmailAutomationTrigger extends AbstractApiData implements EmailAutomationTriggerInterface {
  private _key?: string;
  private _label?: string;

  get key(): string {
    return this._key ?? "";
  }

  get label(): string {
    return this._label ?? "";
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._key = data.jsonApi.attributes.key;
    this._label = data.jsonApi.attributes.label;

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("EmailAutomationTrigger is declared by the API and is read-only");
  }
}
