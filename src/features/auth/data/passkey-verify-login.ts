import { AuthenticationResponseJSON } from "@simplewebauthn/browser";
import { AbstractApiData } from "../../../core";

export type PasskeyVerifyLoginInput = {
  id: string;
  pendingId: string;
  response: AuthenticationResponseJSON;
};

export class PasskeyVerifyLogin extends AbstractApiData {
  createJsonApi(data: PasskeyVerifyLoginInput) {
    return {
      data: {
        type: "passkeys",
        id: data.id,
        attributes: {
          pendingId: data.pendingId,
          response: data.response,
        },
      },
    };
  }
}
