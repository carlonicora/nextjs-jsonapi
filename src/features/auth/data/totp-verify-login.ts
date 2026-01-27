import { AbstractApiData } from "../../../core";

export type TotpVerifyLoginInput = {
  id: string;
  code: string;
};

export class TotpVerifyLogin extends AbstractApiData {
  createJsonApi(data: TotpVerifyLoginInput) {
    return {
      data: {
        type: "totp-authenticators",
        id: data.id,
        attributes: {
          code: data.code,
        },
      },
    };
  }
}
