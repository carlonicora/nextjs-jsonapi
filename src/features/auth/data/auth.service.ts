import { AuthInput, AuthInterface } from ".";
import {
  AbstractService,
  ApiResponseInterface,
  EndpointCreator,
  HttpMethod,
  JsonApiHydratedDataInterface,
  Modules,
  rehydrate,
} from "../../../core";
import { JsonApiDelete, JsonApiGet, JsonApiPost } from "../../../unified";
import { UserInterface } from "../../user";
import { getTokenHandler } from "../config";

export class AuthService extends AbstractService {
  static async login(params: { email: string; password: string; language?: string }): Promise<UserInterface> {
    const language = params.language || "en-US";

    const apiResponse: ApiResponseInterface = await JsonApiPost({
      classKey: Modules.Auth,
      endpoint: new EndpointCreator({ endpoint: Modules.Auth, id: "login" }).generate(),
      body: { email: params.email, password: params.password } as AuthInput,
      language: language,
    });

    if (!apiResponse.ok) throw new Error(apiResponse.error);

    const auth = apiResponse.data as AuthInterface;

    // Use injected token handler if configured
    const handler = getTokenHandler();
    if (handler) {
      await handler.updateToken({
        token: auth.token,
        refreshToken: auth.refreshToken,
        userId: auth.user.id,
        companyId: auth.user.company?.id,
        roles: auth.user.roles.map((role) => role.id),
        features: auth.user.company?.features?.map((feature) => feature.id) ?? [],
        modules: auth.user.modules.map((module) => ({
          id: module.id,
          permissions: module.permissions,
        })),
      });
    }

    return auth.user;
  }

  static async logout(params?: { language?: string }): Promise<void> {
    const language = params?.language || "en-US";

    await JsonApiDelete({
      classKey: Modules.Auth,
      endpoint: new EndpointCreator({ endpoint: Modules.Auth }).generate(),
      language: language,
    });

    // Use injected token handler if configured
    const handler = getTokenHandler();
    if (handler) {
      await handler.removeToken();
    }
  }

  static async initialiseForgotPassword(params: { email: string; language?: string }): Promise<void> {
    const language = params.language || "en-US";

    const response: ApiResponseInterface = await JsonApiPost({
      classKey: Modules.Auth,
      endpoint: new EndpointCreator({ endpoint: Modules.Auth, id: "forgot" }).generate(),
      body: { email: params.email } as AuthInput,
      language: language,
    });

    if (!response.ok) {
      throw new Error(response.error);
    }
  }

  static async register(params: AuthInput): Promise<void> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Auth, id: "register" });

    await this.callApi({
      type: Modules.Auth,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params,
    });
  }

  static async activate(params: { activationCode: string }): Promise<void> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Auth,
      id: "activate",
      childEndpoint: params.activationCode,
    });

    await this.callApi({ type: Modules.Auth, method: HttpMethod.POST, endpoint: endpoint.generate() });
  }

  static async validateCode(params: { code: string; language?: string }): Promise<void> {
    const language = params.language || "en-US";

    const apiResponse: ApiResponseInterface = await JsonApiGet({
      classKey: Modules.Auth,
      endpoint: new EndpointCreator({ endpoint: Modules.Auth, id: "validate", childEndpoint: params.code }).generate(),
      language: language,
    });

    if (!apiResponse.ok) throw new Error(apiResponse.error);
  }

  static async resetPassword(params: { code: string; password: string }): Promise<void> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Auth, id: "reset", childEndpoint: params.code });

    const input: AuthInput = { password: params.password };

    await this.callApi({ type: Modules.Auth, method: HttpMethod.POST, endpoint: endpoint.generate(), input: input });
  }

  static async acceptInvitation(params: { code: string; password: string }): Promise<void> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Auth, id: "invitation", childEndpoint: params.code });

    const input: AuthInput = { password: params.password };

    await this.callApi({ type: Modules.Auth, method: HttpMethod.POST, endpoint: endpoint.generate(), input: input });
  }

  static async findToken(params: { tokenCode: string }): Promise<AuthInterface> {
    return await this.callApi<AuthInterface>({
      type: Modules.Auth,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.Auth }).addAdditionalParam("code", params.tokenCode).generate(),
    });
  }

  static async saveToken(params: { dehydratedAuth: JsonApiHydratedDataInterface }): Promise<void> {
    const auth: AuthInterface = rehydrate(Modules.Auth, params.dehydratedAuth) as AuthInterface;

    const handler = getTokenHandler();
    if (handler) {
      await handler.updateToken({
        token: auth.token,
        refreshToken: auth.refreshToken,
        userId: auth.user.id,
        companyId: auth.user.company?.id,
        roles: auth.user.roles.map((role) => role.id),
        features: auth.user.company?.features?.map((feature) => feature.id) ?? [],
        modules: auth.user.modules.map((module) => ({
          id: module.id,
          permissions: module.permissions,
        })),
      });
    }
  }
}
