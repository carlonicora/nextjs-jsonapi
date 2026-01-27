import { AbstractApiData } from "../../../core";

export type BackupCodeVerifyInput = {
  id: string;
  code: string;
};

export class BackupCodeVerify extends AbstractApiData {
  createJsonApi(data: BackupCodeVerifyInput) {
    return {
      data: {
        type: "backup-codes",
        id: data.id,
        attributes: {
          code: data.code,
        },
      },
    };
  }
}
