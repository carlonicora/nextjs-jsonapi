import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import { InviteValidation, WaitlistInput, WaitlistInterface } from "./WaitlistInterface";
import { WaitlistStatsInterface } from "./waitlist-stats.interface";

export class WaitlistService extends AbstractService {
  /**
   * Submit to waitlist (public)
   * Uses Waitlist.createJsonApi() to transform WaitlistInput to JSON:API format
   */
  static async submit(params: WaitlistInput): Promise<WaitlistInterface> {
    return this.callApi<WaitlistInterface>({
      type: Modules.Waitlist,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.Waitlist }).generate(),
      input: params,
    });
  }

  /**
   * Confirm email (public)
   */
  static async confirm(code: string): Promise<WaitlistInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Waitlist,
      childEndpoint: "confirm",
      childId: code,
    });

    return this.callApi<WaitlistInterface>({
      type: Modules.Waitlist,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * List all waitlist entries (admin)
   * Uses cursor-based pagination with NextRef/PreviousRef
   */
  static async findMany(params?: {
    status?: string;
    search?: string;
    fetchAll?: boolean;
    next?: NextRef;
    prev?: PreviousRef;
  }): Promise<WaitlistInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Waitlist });

    if (params?.status) endpoint.addAdditionalParam("status", params.status);
    if (params?.search) endpoint.addAdditionalParam("search", params.search);
    if (params?.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");

    return this.callApi<WaitlistInterface[]>({
      type: Modules.Waitlist,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params?.next,
      previous: params?.prev,
    });
  }

  /**
   * Send invite (admin)
   */
  static async invite(id: string): Promise<WaitlistInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Waitlist,
      id,
      childEndpoint: "invite",
    });

    return this.callApi<WaitlistInterface>({
      type: Modules.Waitlist,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Batch invite (admin)
   * Non-standard batch operation - uses custom JSON:API format
   */
  static async inviteBatch(ids: string[]): Promise<{ invited: number; failed: number }> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Waitlist,
      childEndpoint: "invite-batch",
    });

    return this.callApi({
      type: Modules.Waitlist,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: {
        data: {
          type: "waitlist-batch-invites",
          attributes: { ids },
        },
      },
      overridesJsonApiCreation: true,
    });
  }

  /**
   * Get statistics (admin)
   */
  static async getStats(): Promise<WaitlistStatsInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.WaitlistStats,
    });

    return this.callApi<WaitlistStatsInterface>({
      type: Modules.WaitlistStats,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Validate invite code (public) - calls auth endpoint
   */
  static async validateInvite(code: string): Promise<InviteValidation | null> {
    try {
      const endpoint = new EndpointCreator({
        endpoint: Modules.Waitlist,
        childEndpoint: "invite",
        childId: code,
      });

      const response = await this.callApiWithMeta<any>({
        type: Modules.Auth,
        method: HttpMethod.GET,
        endpoint: endpoint.generate(),
      });

      // Response structure: data._jsonApi.attributes contains the actual values
      const attributes = response.data?._jsonApi?.attributes;

      return {
        email: attributes?.email,
        valid: attributes?.valid ?? false,
      };
    } catch (_error) {
      return null;
    }
  }
}
