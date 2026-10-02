import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AbstractService } from "../../../../core/abstracts/AbstractService";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { OAuthConsentRequest } from "../../interfaces/oauth.interface";
import { OAuthClient } from "../oauth";
import { OAuthService } from "../oauth.service";

// ModuleRegistry is backed by a globalThis symbol shared across test files in a
// worker, hence the register-if-absent guard (same idiom as HandbookThreadService.spec.ts).
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("OAuth", { name: "oauth-clients", model: OAuthClient } as any);
});

type CallApiParams = { method: string; endpoint: string; input?: unknown; overridesJsonApiCreation?: boolean };
const callApiWithMeta = () => vi.spyOn(AbstractService as any, "callApiWithMeta");
const firstCall = (spy: ReturnType<typeof callApiWithMeta>): CallApiParams => spy.mock.calls[0][0] as CallApiParams;

const fullRequest: OAuthConsentRequest = {
  clientId: "client-1",
  redirectUri: "https://example.test/cb",
  scope: "read mcp",
  state: "xyz",
  codeChallenge: "challenge",
  codeChallengeMethod: "S256",
  companyId: "11111111-1111-4111-8111-111111111111",
};

describe("OAuthClient authorization bodies (RFC 6749 wire format)", () => {
  it("builds the approve body with snake_case keys in wire order", () => {
    const body = new OAuthClient().createApproveAuthorizationJsonApi(fullRequest);

    expect(JSON.stringify(body)).toBe(
      JSON.stringify({
        client_id: "client-1",
        redirect_uri: "https://example.test/cb",
        scope: "read mcp",
        state: "xyz",
        code_challenge: "challenge",
        code_challenge_method: "S256",
        company_id: "11111111-1111-4111-8111-111111111111",
      }),
    );
  });

  it("omits optional approve fields that were not supplied", () => {
    const body = new OAuthClient().createApproveAuthorizationJsonApi({
      clientId: "client-1",
      redirectUri: "https://example.test/cb",
    });

    expect(JSON.stringify(body)).toBe('{"client_id":"client-1","redirect_uri":"https://example.test/cb"}');
  });

  it("builds the deny body with only client_id, redirect_uri and state", () => {
    const body = new OAuthClient().createDenyAuthorizationJsonApi(fullRequest);

    expect(JSON.stringify(body)).toBe(
      '{"client_id":"client-1","redirect_uri":"https://example.test/cb","state":"xyz"}',
    );
  });
});

describe("OAuthService consent calls", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("approveAuthorization sends the model's approve body and returns the redirect url", async () => {
    const spy = callApiWithMeta().mockResolvedValue({ meta: { redirectUrl: "https://example.test/cb?code=1" } });

    const result = await OAuthService.approveAuthorization(fullRequest);

    const call = firstCall(spy);
    expect(call.method).toBe("POST");
    expect(call.endpoint).toContain("oauth/authorize/approve");
    expect(call.overridesJsonApiCreation).toBe(true);
    expect(call.input).toEqual(new OAuthClient().createApproveAuthorizationJsonApi(fullRequest));
    expect(result).toEqual({ redirectUrl: "https://example.test/cb?code=1" });
  });

  it("denyAuthorization sends the model's deny body and returns the redirect url", async () => {
    const spy = callApiWithMeta().mockResolvedValue({
      meta: { redirectUrl: "https://example.test/cb?error=access_denied" },
    });

    const result = await OAuthService.denyAuthorization(fullRequest);

    const call = firstCall(spy);
    expect(call.method).toBe("POST");
    expect(call.endpoint).toContain("oauth/authorize/deny");
    expect(call.overridesJsonApiCreation).toBe(true);
    expect(call.input).toEqual(new OAuthClient().createDenyAuthorizationJsonApi(fullRequest));
    expect(result).toEqual({ redirectUrl: "https://example.test/cb?error=access_denied" });
  });
});
