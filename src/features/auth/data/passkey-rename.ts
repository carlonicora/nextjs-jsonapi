import { AbstractApiData } from "../../../core";

export type PasskeyRenameInput = {
  id: string;
  name: string;
};

export class PasskeyRename extends AbstractApiData {
  createJsonApi(data: PasskeyRenameInput) {
    return {
      data: {
        type: "passkeys",
        id: data.id,
        attributes: {
          name: data.name,
        },
      },
    };
  }
}
