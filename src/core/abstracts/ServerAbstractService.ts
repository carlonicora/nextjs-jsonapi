// Server-only abstract service (NOT a server action - cannot be called from client components)

import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../interfaces/ApiResponseInterface";
import {
  ServerJsonApiGet,
  ServerJsonApiPost,
  ServerJsonApiPut,
  ServerJsonApiPatch,
  ServerJsonApiDelete,
} from "../../server/JsonApiServer";
import { HttpMethod, NextRef, PreviousRef, SelfRef } from "./AbstractService";

/**
 * Server-side abstract base class for services that interact with the JSON:API.
 * Use this for server components and server actions.
 */
export abstract class ServerAbstractService {
  /**
   * Fetch the next page of results.
   */
  static async next<T>(params: {
    type: ApiRequestDataTypeInterface;
    endpoint: string;
    next?: NextRef;
    previous?: PreviousRef;
    self?: SelfRef;
  }): Promise<T> {
    return await this.callApi<T>({
      method: HttpMethod.GET,
      type: params.type,
      endpoint: params.endpoint,
      next: params.next,
      previous: params.previous,
      self: params.self,
    });
  }

  /**
   * Fetch the previous page of results.
   */
  static async previous<T>(params: {
    type: ApiRequestDataTypeInterface;
    endpoint: string;
    next?: NextRef;
    previous?: PreviousRef;
    self?: SelfRef;
  }): Promise<T> {
    return await this.callApi<T>({
      method: HttpMethod.GET,
      type: params.type,
      endpoint: params.endpoint,
      next: params.next,
      previous: params.previous,
      self: params.self,
    });
  }

  /**
   * Make a server-side API call.
   */
  protected static async callApi<T>(params: {
    type: ApiRequestDataTypeInterface;
    method: HttpMethod;
    endpoint: string;
    companyId?: string;
    input?: any;
    overridesJsonApiCreation?: boolean;
    next?: NextRef;
    previous?: PreviousRef;
    self?: SelfRef;
    responseType?: ApiRequestDataTypeInterface;
    files?: { [key: string]: File | Blob } | File | Blob;
  }): Promise<T> {
    let apiResponse: ApiResponseInterface;

    // Get language from next-intl server
    const { getLocale } = await import("next-intl/server");
    const language = (await getLocale()) ?? "en";

    switch (params.method) {
      case HttpMethod.GET:
        apiResponse = await ServerJsonApiGet({
          classKey: params.type,
          endpoint: params.endpoint,
          companyId: params.companyId,
          language: language,
        });
        break;
      case HttpMethod.POST:
        apiResponse = await ServerJsonApiPost({
          classKey: params.type,
          endpoint: params.endpoint,
          companyId: params.companyId,
          body: params.input,
          overridesJsonApiCreation: params.overridesJsonApiCreation,
          language: language,
          responseType: params.responseType,
          files: params.files,
        });
        break;
      case HttpMethod.PUT:
        apiResponse = await ServerJsonApiPut({
          classKey: params.type,
          endpoint: params.endpoint,
          companyId: params.companyId,
          body: params.input,
          language: language,
          responseType: params.responseType,
          files: params.files,
        });
        break;
      case HttpMethod.PATCH:
        apiResponse = await ServerJsonApiPatch({
          classKey: params.type,
          endpoint: params.endpoint,
          companyId: params.companyId,
          body: params.input,
          overridesJsonApiCreation: params.overridesJsonApiCreation,
          language: language,
          responseType: params.responseType,
          files: params.files,
        });
        break;
      case HttpMethod.DELETE:
        apiResponse = await ServerJsonApiDelete({
          classKey: params.type,
          endpoint: params.endpoint,
          companyId: params.companyId,
          language: language,
          responseType: params.responseType,
        });
        break;
      default:
        throw new Error("Method not found");
    }

    if (!apiResponse.ok) {
      const error = new Error(`${apiResponse.response}:${apiResponse.error}`) as any;
      error.status = apiResponse.response;
      error.digest = `HTTP_${apiResponse.response}`;
      throw error;
    }

    if (apiResponse.next && params.next) params.next.next = apiResponse.next;
    if (apiResponse.prev && params.previous) params.previous.previous = apiResponse.prev;
    if (apiResponse.self && params.self) params.self.self = apiResponse.self;

    return apiResponse.data as T;
  }

  /**
   * Get raw JSON:API response data without deserialization.
   */
  protected static async getRawData(params: {
    type: ApiRequestDataTypeInterface;
    method: HttpMethod;
    endpoint: string;
    companyId?: string;
  }): Promise<any> {
    const { getLocale } = await import("next-intl/server");
    const language = (await getLocale()) ?? "en";

    const apiResponse: ApiResponseInterface = await ServerJsonApiGet({
      classKey: params.type,
      endpoint: params.endpoint,
      companyId: params.companyId,
      language: language,
    });

    if (!apiResponse.ok) {
      const error = new Error(`${apiResponse.response}:${apiResponse.error}`) as any;
      error.status = apiResponse.response;
      error.digest = `HTTP_${apiResponse.response}`;
      throw error;
    }

    return apiResponse.raw;
  }
}
