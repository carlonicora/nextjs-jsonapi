import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { CompanyInput, CompanyInterface } from "./company.interface";

export class CompanyService extends AbstractService {
  static async findOne(params: { companyId: string }): Promise<CompanyInterface> {
    return this.callApi<CompanyInterface>({
      type: Modules.Company,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.Company, id: params.companyId }).generate(),
    });
  }

  static async findMany(params: { search?: string; next?: NextRef }): Promise<CompanyInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Company });

    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi<CompanyInterface[]>({
      type: Modules.Company,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async delete(params: { companyId: string }): Promise<void> {
    await this.callApi({
      type: Modules.Company,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.Company, id: params.companyId }).generate(),
    });
  }

  static async create(params: CompanyInput): Promise<CompanyInterface> {
    return this.callApi({
      type: Modules.Company,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.Company }).generate(),
      input: params,
    });
  }

  static async update(params: CompanyInput): Promise<CompanyInterface> {
    return this.callApi({
      type: Modules.Company,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.Company, id: params.id }).generate(),
      input: params,
    });
  }

  static async activateLicense(params: CompanyInput): Promise<CompanyInterface> {
    return this.callApi({
      type: Modules.Company,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.Company, id: params.id, childEndpoint: "license" }).generate(),
      input: params,
    });
  }
}
