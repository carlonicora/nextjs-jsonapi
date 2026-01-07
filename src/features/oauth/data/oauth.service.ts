import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import {
  OAuthClientCreateRequest,
  OAuthClientCreateResponse,
  OAuthClientInput,
  OAuthClientInterface,
  OAuthConsentInfo,
  OAuthConsentRequest,
} from "../interfaces/oauth.interface";

/**
 * Service for OAuth client management and authorization consent flow.
 *
 * Client Management endpoints:
 * - GET /oauth/clients - List all clients for current user
 * - GET /oauth/clients/:clientId - Get single client
 * - POST /oauth/clients - Create new client (returns secret once)
 * - PATCH /oauth/clients/:clientId - Update client
 * - DELETE /oauth/clients/:clientId - Delete client
 * - POST /oauth/clients/:clientId/regenerate-secret - Regenerate client secret
 *
 * Consent Flow endpoints:
 * - GET /oauth/authorize/info - Get client info for consent screen
 * - POST /oauth/authorize/approve - Approve authorization
 * - POST /oauth/authorize/deny - Deny authorization
 */
export class OAuthService extends AbstractService {
  // ==========================================
  // CLIENT MANAGEMENT
  // ==========================================

  /**
   * List all OAuth clients for the current user
   */
  static async listClients(params?: { next?: NextRef }): Promise<OAuthClientInterface[]> {
    return this.callApi<OAuthClientInterface[]>({
      type: Modules.OAuth,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: "oauth/clients" }).generate(),
      next: params?.next,
    });
  }

  /**
   * Get a single OAuth client by ID
   */
  static async getClient(params: { clientId: string }): Promise<OAuthClientInterface> {
    return this.callApi<OAuthClientInterface>({
      type: Modules.OAuth,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: "oauth/clients", id: params.clientId }).generate(),
    });
  }

  /**
   * Create a new OAuth client
   * @returns The created client AND the client secret (shown only once!)
   */
  static async createClient(data: OAuthClientCreateRequest): Promise<OAuthClientCreateResponse> {
    const result = await this.callApiWithMeta<OAuthClientInterface>({
      type: Modules.OAuth,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: "oauth/clients" }).generate(),
      input: data,
    });

    return {
      client: result.data,
      clientSecret: result.meta?.clientSecret as string | undefined,
    };
  }

  /**
   * Update an existing OAuth client
   */
  static async updateClient(params: {
    clientId: string;
    data: Partial<OAuthClientInput>;
  }): Promise<OAuthClientInterface> {
    return this.callApi<OAuthClientInterface>({
      type: Modules.OAuth,
      method: HttpMethod.PATCH,
      endpoint: new EndpointCreator({ endpoint: "oauth/clients", id: params.clientId }).generate(),
      input: { id: params.clientId, ...params.data },
    });
  }

  /**
   * Delete an OAuth client
   */
  static async deleteClient(params: { clientId: string }): Promise<void> {
    await this.callApi({
      type: Modules.OAuth,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: "oauth/clients", id: params.clientId }).generate(),
    });
  }

  /**
   * Regenerate the client secret
   * @returns The new client secret (shown only once!)
   */
  static async regenerateSecret(params: { clientId: string }): Promise<{ clientSecret: string }> {
    const result = await this.callApiWithMeta<OAuthClientInterface>({
      type: Modules.OAuth,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: "oauth/clients",
        id: params.clientId,
        childEndpoint: "regenerate-secret",
      }).generate(),
    });

    return {
      clientSecret: result.meta?.clientSecret as string,
    };
  }

  // ==========================================
  // CONSENT FLOW
  // ==========================================

  /**
   * Get client information for the consent screen
   * Called when user is redirected to /oauth/authorize
   */
  static async getAuthorizationInfo(params: OAuthConsentRequest): Promise<OAuthConsentInfo> {
    const endpoint = new EndpointCreator({ endpoint: "oauth/authorize/info" });

    // Add query parameters
    endpoint.addAdditionalParam("client_id", params.clientId);
    endpoint.addAdditionalParam("redirect_uri", params.redirectUri);
    endpoint.addAdditionalParam("scope", params.scope);
    if (params.state) endpoint.addAdditionalParam("state", params.state);
    if (params.codeChallenge) endpoint.addAdditionalParam("code_challenge", params.codeChallenge);
    if (params.codeChallengeMethod) endpoint.addAdditionalParam("code_challenge_method", params.codeChallengeMethod);

    return this.callApi<OAuthConsentInfo>({
      type: Modules.OAuth,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Approve the authorization request
   * @returns Redirect URL with authorization code
   */
  static async approveAuthorization(params: OAuthConsentRequest): Promise<{ redirectUrl: string }> {
    const result = await this.callApiWithMeta<unknown>({
      type: Modules.OAuth,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: "oauth/authorize/approve" }).generate(),
      input: {
        client_id: params.clientId,
        redirect_uri: params.redirectUri,
        scope: params.scope,
        state: params.state,
        code_challenge: params.codeChallenge,
        code_challenge_method: params.codeChallengeMethod,
      },
      overridesJsonApiCreation: true,
    });

    return {
      redirectUrl: result.meta?.redirectUrl as string,
    };
  }

  /**
   * Deny the authorization request
   * @returns Redirect URL with error=access_denied
   */
  static async denyAuthorization(params: OAuthConsentRequest): Promise<{ redirectUrl: string }> {
    const result = await this.callApiWithMeta<unknown>({
      type: Modules.OAuth,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: "oauth/authorize/deny" }).generate(),
      input: {
        client_id: params.clientId,
        redirect_uri: params.redirectUri,
        state: params.state,
      },
      overridesJsonApiCreation: true,
    });

    return {
      redirectUrl: result.meta?.redirectUrl as string,
    };
  }
}
