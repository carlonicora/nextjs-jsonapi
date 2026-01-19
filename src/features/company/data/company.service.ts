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

  static async selfDelete(params: { companyId: string }): Promise<void> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Company,
      id: params.companyId,
      childEndpoint: "self-delete",
    }).generate();

    console.log("[CompanyService.selfDelete] Called with companyId:", params.companyId);
    console.log("[CompanyService.selfDelete] Generated endpoint:", endpoint);

    try {
      await this.callApi({
        type: Modules.Company,
        method: HttpMethod.DELETE,
        endpoint: endpoint,
      });
      console.log("[CompanyService.selfDelete] API call successful");
    } catch (error) {
      console.error("[CompanyService.selfDelete] API call failed:", error);
      throw error;
    }
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

  static async updateConfigurations(params: CompanyInput): Promise<CompanyInterface> {
    return this.callApi({
      type: Modules.Company,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({
        endpoint: Modules.Company,
        id: params.id,
        childEndpoint: "configurations",
      }).generate(),
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
