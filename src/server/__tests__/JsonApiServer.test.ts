import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerToken: vi.fn(),
  serverRequest: vi.fn(),
  translateResponse: vi.fn(),
}));

vi.mock("../token", () => ({ getServerToken: mocks.getServerToken }));
vi.mock("../request", () => ({ serverRequest: mocks.serverRequest }));
vi.mock("../../core/utils/translateResponse", () => ({ translateResponse: mocks.translateResponse }));

import { configureServerJsonApi, ServerJsonApiGet } from "../JsonApiServer";

describe("ServerJsonApiGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureServerJsonApi({ apiUrl: "http://api.test" });
    mocks.getServerToken.mockResolvedValue("secret-token");
    mocks.serverRequest.mockResolvedValue({ data: undefined, ok: true, status: 200, statusText: "OK" });
    mocks.translateResponse.mockResolvedValue({});
  });

  it("does not read the token cookie for a cached GET", async () => {
    await ServerJsonApiGet({ classKey: { name: "help", cache: "help" } as any, endpoint: "/help", language: "en" });

    expect(mocks.getServerToken).not.toHaveBeenCalled();
    expect(mocks.serverRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "http://api.test/help", cache: "help", token: undefined }),
    );
  });

  it("reads the token cookie for an uncached GET", async () => {
    await ServerJsonApiGet({ classKey: { name: "users" } as any, endpoint: "/users", language: "en" });

    expect(mocks.getServerToken).toHaveBeenCalledTimes(1);
    expect(mocks.serverRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "http://api.test/users", token: "secret-token" }),
    );
  });
});
