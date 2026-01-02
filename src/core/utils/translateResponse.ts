import { ApiData } from "../interfaces/ApiData";
import { ApiDataInterface } from "../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../interfaces/ApiResponseInterface";
import { DataClassRegistry } from "../registry/DataClassRegistry";

/**
 * Translates raw JSON:API data into typed objects.
 * Does not require API response metadata.
 */
export function translateData<T extends ApiDataInterface>(params: {
  classKey: ApiRequestDataTypeInterface;
  data: any;
}): T | T[] {
  const factoryClass = DataClassRegistry.get(params.classKey);

  if (!factoryClass) {
    throw new Error(
      `Class not registered for key: ${typeof params.classKey === "string" ? params.classKey : params.classKey.name}`,
    );
  }

  const included: any = params.data.included ?? [];

  if (Array.isArray(params.data.data)) {
    const responseData: T[] = [];

    for (const data of params.data.data) {
      const object = new factoryClass();
      object.rehydrate({ jsonApi: data, included: included, allData: params.data.data });
      responseData.push(object as T);
    }

    return responseData as T[];
  } else {
    const responseData = new factoryClass();
    responseData.rehydrate({
      jsonApi: params.data.data,
      included: included,
    });

    return responseData as T;
  }
}

/**
 * Translates a full API response into a typed ApiResponseInterface.
 * Includes pagination support.
 */
export async function translateResponse<T extends ApiDataInterface>(params: {
  classKey: ApiRequestDataTypeInterface;
  apiResponse: ApiData;
  companyId?: string;
  language: string;
  paginationHandler?: (endpoint: string) => Promise<ApiResponseInterface>;
}): Promise<ApiResponseInterface> {
  const response: ApiResponseInterface = {
    ok: true,
    response: 0,
    data: [],
    error: "",
  };

  const factoryClass = DataClassRegistry.get(params.classKey);

  if (!factoryClass) {
    throw new Error(
      `Class not registered for key: ${typeof params.classKey === "string" ? params.classKey : params.classKey.name}`,
    );
  }

  response.ok = params.apiResponse.ok;
  response.response = params.apiResponse.status;

  if (!params.apiResponse.ok) {
    response.error = params.apiResponse?.data?.message ?? params.apiResponse.statusText;
    return response;
  }

  if (params.apiResponse.status === 204) return response;

  response.raw = params.apiResponse.data;

  // Extract meta from JSON:API response
  if (params.apiResponse.data?.meta) {
    response.meta = params.apiResponse.data.meta;
  }

  try {
    // Check if response is JSON:API formatted (has a 'data' property)
    // If not, return the raw response data directly (e.g., { url: "..." } or { clientSecret: "..." })
    if (
      params.apiResponse.data &&
      typeof params.apiResponse.data === "object" &&
      !Array.isArray(params.apiResponse.data) &&
      params.apiResponse.data.data === undefined
    ) {
      response.data = params.apiResponse.data;
      return response;
    }

    const included: any = params.apiResponse.data.included ?? [];

    if (params.apiResponse.data.links) {
      response.self = params.apiResponse.data.links.self;

      if (params.apiResponse.data.links.next && params.paginationHandler) {
        response.next = params.apiResponse.data.links.next;
        response.nextPage = async () => params.paginationHandler!(params.apiResponse.data.links.next);
      }

      if (params.apiResponse.data.links.prev && params.paginationHandler) {
        response.prev = params.apiResponse.data.links.prev;
        response.prevPage = async () => params.paginationHandler!(params.apiResponse.data.links.prev);
      }
    }

    if (Array.isArray(params.apiResponse.data.data)) {
      const responseData: T[] = [];

      for (const data of params.apiResponse.data.data) {
        const object = new factoryClass();
        object.rehydrate({ jsonApi: data, included: included, allData: params.apiResponse.data.data });
        responseData.push(object as T);
      }

      response.data = responseData;
    } else {
      const responseData = new factoryClass();
      responseData.rehydrate({
        jsonApi: params.apiResponse.data.data,
        included: included,
      });

      response.data = responseData;
    }
  } catch (e) {
    console.error(e);
  }

  return response;
}
