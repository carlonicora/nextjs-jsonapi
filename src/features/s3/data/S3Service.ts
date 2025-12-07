import { AbstractService, HttpMethod } from "../../../core/abstracts/AbstractService";
import { EndpointCreator } from "../../../core/endpoint/EndpointCreator";
import { Modules } from "../../../core/registry/ModuleRegistry";
import { S3Interface } from "./S3Interface";

export class S3Service extends AbstractService {
  static async getPreSignedUrl(params: { key: string; contentType: string; isPublic?: boolean }): Promise<S3Interface> {
    const endpoint = new EndpointCreator({ endpoint: Modules.S3 })
      .addAdditionalParam("key", params.key)
      .addAdditionalParam("contentType", params.contentType);

    if (params.isPublic) endpoint.addAdditionalParam("isPublic", "true");

    return this.callApi<S3Interface>({ type: Modules.S3, method: HttpMethod.GET, endpoint: endpoint.generate() });
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
