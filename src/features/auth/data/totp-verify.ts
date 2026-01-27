import { AbstractApiData } from "../../../core";

export type TotpVerifyInput = {
  id: string;
  authenticatorId: string;
  code: string;
};

export class TotpVerify extends AbstractApiData {
  createJsonApi(data: TotpVerifyInput) {
    return {
      data: {
        type: "totp-authenticators",
        id: data.id,
        attributes: {
          authenticatorId: data.authenticatorId,
          code: data.code,
        },
      },
    };
  }
}
