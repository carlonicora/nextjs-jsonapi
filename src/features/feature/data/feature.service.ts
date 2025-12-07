import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { FeatureInterface } from "./feature.interface";

export class FeatureService extends AbstractService {
  static async findMany(params: { companyId?: string; search?: string; next?: NextRef }): Promise<FeatureInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Feature });

    if (params.companyId) endpoint.endpoint(Modules.Company).id(params.companyId).childEndpoint(Modules.Feature);

    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi<FeatureInterface[]>({
      type: Modules.Feature,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }
}
