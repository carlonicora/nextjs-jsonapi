import {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { getTokenHandler } from "../config";
import { AuthInterface } from "./auth.interface";
import { PasskeyInterface } from "./passkey.interface";
import { PasskeyRegistrationOptionsInterface } from "./passkey-registration-options";
import { TotpAuthenticatorInterface } from "./totp-authenticator.interface";
import { TotpSetupInterface } from "./totp-setup.interface";
import { TwoFactorChallengeInterface } from "./two-factor-challenge.interface";
import { TwoFactorStatusInterface } from "./two-factor-status.interface";

export class TwoFactorService extends AbstractService {
  // ============================================================
  // Status
  // ============================================================

  static async getStatus(): Promise<TwoFactorStatusInterface> {
    return this.callApi<TwoFactorStatusInterface>({
      type: Modules.TwoFactorStatus,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "two-factor",
        childEndpoint: "status",
      }).generate(),
    });
  }

  static async enable(params: { id: string; preferredMethod: "totp" | "passkey" }): Promise<void> {
    await this.callApi({
      type: Modules.TwoFactorEnable,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "two-factor",
        childEndpoint: "enable",
      }).generate(),
      input: params,
    });
  }

  static async disable(params: { code: string }): Promise<void> {
    await this.callApi({
      type: Modules.Auth,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "two-factor",
        childEndpoint: "disable",
      }).generate(),
      input: { code: params.code },
    });
  }

  // ============================================================
  // TOTP
  // ============================================================

  static async setupTotp(params: { id: string; name: string; accountName: string }): Promise<TotpSetupInterface> {
    return this.callApi<TotpSetupInterface>({
      type: Modules.TotpSetup,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "totp",
        childEndpoint: "setup",
      }).generate(),
      input: params,
    });
  }

  static async verifyTotpSetup(params: { id: string; authenticatorId: string; code: string }): Promise<void> {
    await this.callApi({
      type: Modules.TotpVerify,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "totp",
        childEndpoint: "verify-setup",
      }).generate(),
      input: params,
    });
  }

  static async listTotpAuthenticators(): Promise<TotpAuthenticatorInterface[]> {
    return this.callApi<TotpAuthenticatorInterface[]>({
      type: Modules.TotpAuthenticator,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "totp",
        childEndpoint: "authenticators",
      }).generate(),
    });
  }

  static async deleteTotpAuthenticator(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.Auth,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "totp",
        childEndpoint: "authenticators",
        childId: params.id,
      }).generate(),
    });
  }

  // ============================================================
  // Passkeys
  // ============================================================

  static async getPasskeyRegistrationOptions(params: {
    id: string;
    userName: string;
    userDisplayName?: string;
  }): Promise<PasskeyRegistrationOptionsInterface> {
    return this.callApi<PasskeyRegistrationOptionsInterface>({
      type: Modules.PasskeyRegistrationOptions,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "passkey",
        childEndpoint: "register",
        childId: "options",
      }).generate(),
      input: params,
    });
  }

  static async verifyPasskeyRegistration(params: {
    id: string;
    pendingId: string;
    name: string;
    response: RegistrationResponseJSON;
  }): Promise<PasskeyInterface> {
    return this.callApi<PasskeyInterface>({
      type: Modules.PasskeyRegistrationVerify,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "passkey",
        childEndpoint: "register",
        childId: "verify",
      }).generate(),
      input: params,
    });
  }

  static async listPasskeys(): Promise<PasskeyInterface[]> {
    return this.callApi<PasskeyInterface[]>({
      type: Modules.Passkey,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "passkeys",
      }).generate(),
    });
  }

  static async deletePasskey(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.Auth,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "passkeys",
        childEndpoint: params.id,
      }).generate(),
    });
  }

  static async renamePasskey(params: { id: string; name: string }): Promise<PasskeyInterface> {
    return this.callApi<PasskeyInterface>({
      type: Modules.PasskeyRename,
      method: HttpMethod.PATCH,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "passkeys",
        childEndpoint: params.id,
      }).generate(),
      input: { id: params.id, name: params.name },
    });
  }

  // ============================================================
  // Backup Codes
  // ============================================================

  static async generateBackupCodes(): Promise<string[]> {
    const response = await this.callApi<{ codes: string[] }>({
      type: Modules.Auth,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "backup-codes",
        childEndpoint: "generate",
      }).generate(),
    });
    return response.codes;
  }

  static async getBackupCodesCount(): Promise<number> {
    const response = await this.callApi<{ count: number }>({
      type: Modules.Auth,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "backup-codes",
        childEndpoint: "count",
      }).generate(),
    });
    return response.count;
  }

  // ============================================================
  // Login 2FA Verification
  // ============================================================

  static async getChallenge(params: {
    id: string;
    pendingToken: string;
    method: "totp" | "passkey" | "backup";
  }): Promise<TwoFactorChallengeInterface> {
    return this.callApi<TwoFactorChallengeInterface>({
      type: Modules.TwoFactorChallenge,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "two-factor",
        childEndpoint: "challenge",
      }).generate(),
      input: { id: params.id, method: params.method },
    });
  }

  static async verifyTotp(params: { id: string; pendingToken: string; code: string }): Promise<AuthInterface> {
    console.log("[DEBUG verifyTotp] params:", JSON.stringify(params, null, 2));
    console.log(
      "[DEBUG verifyTotp] input being passed:",
      JSON.stringify({ id: params.id, code: params.code }, null, 2),
    );
    const auth = await this.callApi<AuthInterface>({
      type: Modules.TotpVerifyLogin, // Request: { type: "totp-authenticators", attributes: { code } }
      responseType: Modules.Auth, // Response: Auth with user relationship
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "two-factor",
        childEndpoint: "verify",
        childId: "totp",
      }).generate(),
      input: { id: params.id, code: params.code },
      token: params.pendingToken,
    });

    // Update token handler with new credentials
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

    return auth;
  }

  static async getPasskeyAuthOptions(params: { pendingToken: string }): Promise<{
    pendingId: string;
    options: PublicKeyCredentialRequestOptionsJSON;
  }> {
    return this.callApi<{ pendingId: string; options: PublicKeyCredentialRequestOptionsJSON }>({
      type: Modules.Auth,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "two-factor",
        childEndpoint: "verify/passkey",
        childId: "options",
      }).generate(),
      token: params.pendingToken,
    });
  }

  static async verifyPasskey(params: {
    id: string;
    pendingToken: string;
    pendingId: string;
    credential: AuthenticationResponseJSON;
  }): Promise<AuthInterface> {
    const auth = await this.callApi<AuthInterface>({
      type: Modules.PasskeyVerifyLogin, // Request: passkey verification format
      responseType: Modules.Auth, // Response: Auth with user relationship
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "two-factor",
        childEndpoint: "verify",
        childId: "passkey",
      }).generate(),
      input: { id: params.id, pendingId: params.pendingId, response: params.credential },
      token: params.pendingToken,
    });

    // Update token handler with new credentials
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

    return auth;
  }

  static async verifyBackupCode(params: { id: string; pendingToken: string; code: string }): Promise<AuthInterface> {
    const auth = await this.callApi<AuthInterface>({
      type: Modules.BackupCodeVerify, // Request: backup code verification format
      responseType: Modules.Auth, // Response: Auth with user relationship
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Auth,
        id: "two-factor",
        childEndpoint: "verify",
        childId: "backup",
      }).generate(),
      input: { id: params.id, code: params.code },
      token: params.pendingToken,
    });

    // Update token handler with new credentials
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

    return auth;
  }
}
