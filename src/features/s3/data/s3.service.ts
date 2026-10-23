import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { S3Interface } from "./s3.interface";

export class S3Service extends AbstractService {
  static async getPreSignedUrl(params: { key: string; contentType: string; isPublic?: boolean }): Promise<S3Interface> {
    const endpoint = new EndpointCreator({ endpoint: Modules.S3 })
      .addAdditionalParam("key", params.key)
      .addAdditionalParam("contentType", params.contentType);

    if (params.isPublic) endpoint.addAdditionalParam("isPublic", "true");

    return this.callApi<S3Interface>({ type: Modules.S3, method: HttpMethod.GET, endpoint: endpoint.generate() });
  }

  /**
   * Presigns `key` and PUTs `file` to the presigned S3 URL. The PUT goes straight
   * to object storage (not the JSON:API backend), so it cannot use callApi.
   * Throws when the upload is rejected.
   */
  static async upload(params: { key: string; contentType: string; file: Blob; isPublic?: boolean }): Promise<void> {
    const s3 = await this.getPreSignedUrl({
      key: params.key,
      contentType: params.contentType,
      isPublic: params.isPublic,
    });

    const response = await fetch(s3.url, { method: "PUT", headers: s3.headers, body: params.file });

    if (!response.ok) throw new Error(`S3 upload failed: ${response.status}`);
  }

  static async getSignedUrl(params: { key: string; isPublic?: boolean }): Promise<S3Interface> {
    const endpoint = new EndpointCreator({ endpoint: Modules.S3, id: "sign" }).addAdditionalParam("key", params.key);

    if (params.isPublic) endpoint.addAdditionalParam("isPublic", "true");

    return this.callApi<S3Interface>({ type: Modules.S3, method: HttpMethod.GET, endpoint: endpoint.generate() });
  }

  static async deleteFile(params: { key: string }): Promise<void> {
    this.callApi<S3Interface>({
      type: Modules.S3,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.S3 }).addAdditionalParam("key", params.key).generate(),
    });
  }
}
