import { AbstractApiData, Modules } from "../../../core";
import { PushInput, PushInterface } from "./push.interface";

export class Push extends AbstractApiData implements PushInterface {
  createJsonApi(data: PushInput) {
    const response: any = {
      data: {
        type: Modules.Push.name,
        attributes: {
          key: data.key,
        },
      },
      included: [],
    };

    return response;
  }
}
