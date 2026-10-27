import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { EmailBlastAudienceInterface } from "./EmailBlastAudienceInterface";

export class EmailBlastAudience extends AbstractApiData implements EmailBlastAudienceInterface {
  private _recipientCount?: number;

  get recipientCount(): number {
    return this._recipientCount ?? 0;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._recipientCount = data.jsonApi.attributes.recipientCount;

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("EmailBlastAudience is computed by the API and is read-only");
  }
}
