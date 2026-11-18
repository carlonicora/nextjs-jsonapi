import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { SkillInput, SkillInterface } from "./SkillInterface";

/** Path segment of the Administrator's global-skill routes (`skills/global…`). */
const GLOBAL = "global";

/** Path segment of the Administrator's routes on a picked company (`skills/companies/:companyId…`). */
const COMPANIES = "companies";

/**
 * The endpoint of a company route. Without `companyId` it is the caller's own
 * company (`skills[/:id[/action]]`); with it, the Administrator's route on that
 * company (`skills/companies/:companyId[/:id[/action]]`), with the same payloads.
 */
function companyEndpoint(params: { companyId?: string; id?: string; action?: string }): EndpointCreator {
  if (!params.companyId)
    return new EndpointCreator({ endpoint: Modules.Skill, id: params.id, childEndpoint: params.action });

  const base = new EndpointCreator({ endpoint: Modules.Skill, id: COMPANIES, childEndpoint: params.companyId });
  if (!params.id) return base;
  return new EndpointCreator({ endpoint: base.generate(), id: params.id, childEndpoint: params.action });
}

export class SkillService extends AbstractService {
  // Company routes. `companyId` (Administrator only) targets the picked company.

  /** GET skills: the company's list with states (Company Administrator). */
  static async findMany(
    params: { search?: string; next?: NextRef; companyId?: string } = {},
  ): Promise<SkillInterface[]> {
    const endpoint = companyEndpoint({ companyId: params.companyId });

    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.Skill.inclusions?.lists?.fields) endpoint.limitToFields(Modules.Skill.inclusions.lists.fields);

    return this.callApi({
      type: Modules.Skill,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  /** GET skills/active: the skills the Assistant can use, without `instructions`. */
  static async findActive(): Promise<SkillInterface[]> {
    return this.callApi({
      type: Modules.Skill,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.Skill, id: "active" }).generate(),
    });
  }

  static async findOne(params: { id: string; companyId?: string }): Promise<SkillInterface> {
    return this.callApi<SkillInterface>({
      type: Modules.Skill,
      method: HttpMethod.GET,
      endpoint: companyEndpoint({ companyId: params.companyId, id: params.id }).generate(),
    });
  }

  /** POST skills: a new company skill, or a copy of a global one when `originalId` is set. */
  static async create(params: SkillInput, options: { companyId?: string } = {}): Promise<SkillInterface> {
    return this.callApi({
      type: Modules.Skill,
      method: HttpMethod.POST,
      endpoint: companyEndpoint({ companyId: options.companyId }).generate(),
      input: params,
    });
  }

  static async update(params: SkillInput, options: { companyId?: string } = {}): Promise<SkillInterface> {
    return this.callApi({
      type: Modules.Skill,
      method: HttpMethod.PUT,
      endpoint: companyEndpoint({ companyId: options.companyId, id: params.id }).generate(),
      input: params,
    });
  }

  /** DELETE skills/:id: an own skill, or a copy ("Restore original"). */
  static async delete(params: { id: string; companyId?: string }): Promise<void> {
    await this.callApi({
      type: Modules.Skill,
      method: HttpMethod.DELETE,
      endpoint: companyEndpoint({ companyId: params.companyId, id: params.id }).generate(),
    });
  }

  static async enable(params: { id: string; companyId?: string }): Promise<SkillInterface> {
    return this.callApi<SkillInterface>({
      type: Modules.Skill,
      method: HttpMethod.POST,
      endpoint: companyEndpoint({ companyId: params.companyId, id: params.id, action: "enable" }).generate(),
    });
  }

  static async disable(params: { id: string; companyId?: string }): Promise<SkillInterface> {
    return this.callApi<SkillInterface>({
      type: Modules.Skill,
      method: HttpMethod.POST,
      endpoint: companyEndpoint({ companyId: params.companyId, id: params.id, action: "disable" }).generate(),
    });
  }

  // Administrator routes (global skills only)

  static async findGlobal(params: { search?: string; next?: NextRef } = {}): Promise<SkillInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Skill, id: GLOBAL });

    if (params.search) endpoint.addAdditionalParam("search", params.search);
    if (Modules.Skill.inclusions?.lists?.fields) endpoint.limitToFields(Modules.Skill.inclusions.lists.fields);

    return this.callApi({
      type: Modules.Skill,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findOneGlobal(params: { id: string }): Promise<SkillInterface> {
    return this.callApi<SkillInterface>({
      type: Modules.Skill,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.Skill, id: GLOBAL, childEndpoint: params.id }).generate(),
    });
  }

  static async createGlobal(params: SkillInput): Promise<SkillInterface> {
    return this.callApi({
      type: Modules.Skill,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.Skill, id: GLOBAL }).generate(),
      input: params,
    });
  }

  static async updateGlobal(params: SkillInput): Promise<SkillInterface> {
    return this.callApi({
      type: Modules.Skill,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.Skill, id: GLOBAL, childEndpoint: params.id }).generate(),
      input: params,
    });
  }

  static async deleteGlobal(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.Skill,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.Skill, id: GLOBAL, childEndpoint: params.id }).generate(),
    });
  }

  static async enableGlobal(params: { id: string }): Promise<SkillInterface> {
    return this.callApi<SkillInterface>({
      type: Modules.Skill,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Skill,
        id: GLOBAL,
        childEndpoint: params.id,
        childId: "enable",
      }).generate(),
    });
  }

  static async disableGlobal(params: { id: string }): Promise<SkillInterface> {
    return this.callApi<SkillInterface>({
      type: Modules.Skill,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Skill,
        id: GLOBAL,
        childEndpoint: params.id,
        childId: "disable",
      }).generate(),
    });
  }
}
