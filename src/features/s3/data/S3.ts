import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { S3Input, S3Interface } from "./s3.interface";

export class S3 extends AbstractApiData implements S3Interface {
  private _url?: string;
  private _storageType?: string;
  private _contentType?: string;
  private _blobType?: string;
  private _acl?: string;

  get url(): string {
    if (!this._url) throw new Error("Image URL is not set.");
    return this._url;
  }

  get headers(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this._contentType) {
      headers["Content-Type"] = this._contentType;
    }

    if (this._blobType) {
      headers["x-ms-blob-type"] = this._blobType;
    }

    if (this._acl) {
      headers["x-amz-acl"] = this._acl;
    }

    return headers;
  }
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._url = data.jsonApi.attributes.url ?? undefined;
    this._storageType = data.jsonApi.attributes.storageType ?? undefined;
    this._contentType = data.jsonApi.attributes.contentType ?? undefined;
    this._blobType = data.jsonApi.attributes.blobType ?? undefined;
    this._acl = data.jsonApi.attributes.acl ?? undefined;

    return this;
  }

  createJsonApi(data: S3Input) {
    const response: any = {
      data: {
        type: Modules.S3.name,
        attributes: {
          key: data.key,
        },
      },
      included: [],
    };

    if (data.contentType) response.data.attributes.contentType = data.contentType;

    return response;
  }
}
