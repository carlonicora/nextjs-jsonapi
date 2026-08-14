import { beforeEach, describe, expect, it } from "vitest";
import { ApiData } from "../../interfaces/ApiData";
import { ApiDataInterface } from "../../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../../interfaces/ApiRequestDataTypeInterface";
import { DataClassRegistry } from "../../registry/DataClassRegistry";
import { translateResponse } from "../translateResponse";

class StubData implements Partial<ApiDataInterface> {
  id = "";
  rehydrate(): void {}
}

const stubModule = {
  name: "stub-module",
  model: StubData as unknown as { new (): ApiDataInterface },
} as unknown as ApiRequestDataTypeInterface;

const errorResponse = (params: { status: number; statusText: string; data: unknown }): ApiData =>
  ({
    ok: false,
    status: params.status,
    statusText: params.statusText,
    data: params.data,
  }) as ApiData;

describe("translateResponse error extraction", () => {
  beforeEach(() => {
    DataClassRegistry.clear();
    DataClassRegistry.registerObjectClass(stubModule, StubData as unknown as { new (): ApiDataInterface });
  });

  it("reads the `error` key used by API error bodies", async () => {
    const response = await translateResponse({
      classKey: stubModule,
      // HTTP/2 drops the reason phrase, so statusText is empty in the browser.
      apiResponse: errorResponse({ status: 404, statusText: "", data: { error: "Customer not found" } }),
      language: "en",
    });

    expect(response.ok).toBe(false);
    expect(response.response).toBe(404);
    expect(response.error).toBe("Customer not found");
  });

  it("still prefers the `message` key when present", async () => {
    const response = await translateResponse({
      classKey: stubModule,
      apiResponse: errorResponse({ status: 400, statusText: "", data: { message: "Validation failed" } }),
      language: "en",
    });

    expect(response.error).toBe("Validation failed");
  });

  it("falls back to statusText when the body carries no error text", async () => {
    const response = await translateResponse({
      classKey: stubModule,
      apiResponse: errorResponse({ status: 500, statusText: "Internal Server Error", data: undefined }),
      language: "en",
    });

    expect(response.error).toBe("Internal Server Error");
  });
});
