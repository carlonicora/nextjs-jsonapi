import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { OAuthClientInput, OAuthClientInterface, OAuthConsentRequest } from "../interfaces/oauth.interface";

/**
 * OAuth client data model
 * Represents a registered OAuth application that can request access tokens
 */
export class OAuthClient extends AbstractApiData implements OAuthClientInterface {
  private _clientId?: string;
  private _name?: string;
  private _description?: string;
  private _redirectUris: string[] = [];
  private _allowedScopes: string[] = [];
  private _allowedGrantTypes: string[] = [];
  private _isConfidential: boolean = true;
  private _isActive: boolean = true;

  get clientId(): string {
    return this._clientId ?? this.id;
  }

  get name(): string {
    if (!this._name) throw new Error("Name is not defined");
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get redirectUris(): string[] {
    return this._redirectUris;
  }

  get allowedScopes(): string[] {
    return this._allowedScopes;
  }

  get allowedGrantTypes(): string[] {
    return this._allowedGrantTypes;
  }

  get isConfidential(): boolean {
    return this._isConfidential;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes || {};

    this._clientId = attrs.clientId ?? this._id;
    this._name = attrs.name;
    this._description = attrs.description;
    this._redirectUris = attrs.redirectUris ?? [];
    this._allowedScopes = attrs.allowedScopes ?? [];
    this._allowedGrantTypes = attrs.allowedGrantTypes ?? [];
    this._isConfidential = attrs.isConfidential ?? true;
    this._isActive = attrs.isActive ?? true;

    return this;
  }

  createJsonApi(data: OAuthClientInput) {
    const response: any = {
      data: {
        type: "oauth-clients",
        attributes: {},
      },
    };

    if (data.id) response.data.id = data.id;
    if (data.name !== undefined) response.data.attributes.name = data.name;
    if (data.description !== undefined) response.data.attributes.description = data.description;
    if (data.redirectUris !== undefined) response.data.attributes.redirectUris = data.redirectUris;
    if (data.allowedScopes !== undefined) response.data.attributes.allowedScopes = data.allowedScopes;
    if (data.allowedGrantTypes !== undefined) response.data.attributes.allowedGrantTypes = data.allowedGrantTypes;
    if (data.isConfidential !== undefined) response.data.attributes.isConfidential = data.isConfidential;
    if (data.isActive !== undefined) response.data.attributes.isActive = data.isActive;

    return response;
  }

  /**
   * Body for POST /oauth/authorize/approve.
   * The authorize endpoints speak the RFC 6749 wire format (snake_case keys,
   * no JSON:API envelope), so this dedicated method owns that shape and the
   * service sends it with `overridesJsonApiCreation`.
   */
  createApproveAuthorizationJsonApi(params: OAuthConsentRequest) {
    return {
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: params.scope,
      state: params.state,
      code_challenge: params.codeChallenge,
      code_challenge_method: params.codeChallengeMethod,
      company_id: params.companyId,
    };
  }

  /**
   * Body for POST /oauth/authorize/deny (RFC 6749 wire format, see above).
   */
  createDenyAuthorizationJsonApi(params: OAuthConsentRequest) {
    return {
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      state: params.state,
    };
  }
}
