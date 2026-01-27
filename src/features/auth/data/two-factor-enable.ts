import { AbstractApiData } from "../../../core";

export type TwoFactorEnableInput = {
  id: string;
  preferredMethod: "totp" | "passkey";
};

export class TwoFactorEnable extends AbstractApiData {
  createJsonApi(data: TwoFactorEnableInput) {
    return {
      data: {
        type: "two-factor-configs",
        id: data.id,
        attributes: {
          preferredMethod: data.preferredMethod,
        },
      },
    };
  }
}
