"use client";

import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../interfaces/ApiResponseInterface";
import {
  ClientJsonApiGet,
  ClientJsonApiPost,
  ClientJsonApiPut,
  ClientJsonApiPatch,
  ClientJsonApiDelete,
} from "../../client/JsonApiClient";
// Duplicated to avoid importing from AbstractService which pulls in server code
// These are exported so client services can import them from here instead of core
export enum ClientHttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export interface ClientNextRef {
  next?: string;
}

export interface ClientPreviousRef {
  previous?: string;
}

export interface ClientSelfRef {
  self?: string;
}

let globalErrorHandler: ((status: number, message: string) => void) | null = null;

/**
 * Set a global error handler for API errors (client-side only).
 * This handler will be called instead of throwing errors.
 */
export function setClientGlobalErrorHandler(handler: (status: number, message: string) => void) {
  globalErrorHandler = handler;
}

/**
 * Get the current global error handler.
 */
export function getClientGlobalErrorHandler(): ((status: number, message: string) => void) | null {
  return globalErrorHandler;
}

/**
 * Client-side abstract base class for services that interact with the JSON:API.
 * Use this for client components.
 */
export abstract class ClientAbstractService {
  /**
   * Extract locale from client-side URL pathname
   * URL structure: /{locale}/route-path (e.g., /it/accounts)
   * Fallback chain: URL locale → navigator.language → "en"
   */
  private static getClientLocale(): string {
    if (typeof window === "undefined") {
      return "en"; // Should not happen in client service
    }

    // Extract locale from URL pathname (first segment after leading slash)
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const urlLocale = pathSegments[0];

    // Validate against supported locales (currently only "en")
    const supportedLocales = ["en"];
    if (urlLocale && supportedLocales.includes(urlLocale)) {
      return urlLocale;
    }

    // Fallback to navigator language
    const navigatorLocale = navigator.language.split("-")[0];
    if (navigatorLocale && supportedLocales.includes(navigatorLocale)) {
      return navigatorLocale;
    }

    // Final fallback
    return "en";
  }

  /**
   * Fetch the next page of results.
   */
  static async next<T>(params: {
    type: ApiRequestDataTypeInterface;
    endpoint: string;
    next?: ClientNextRef;
    previous?: ClientPreviousRef;
    self?: ClientSelfRef;
  }): Promise<T> {
    return await this.callApi<T>({
      method: ClientHttpMethod.GET,
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
    next?: ClientNextRef;
    previous?: ClientPreviousRef;
    self?: ClientSelfRef;
  }): Promise<T> {
    return await this.callApi<T>({
      method: ClientHttpMethod.GET,
      type: params.type,
      endpoint: params.endpoint,
      next: params.next,
      previous: params.previous,
      self: params.self,
    });
  }

  /**
   * Make a client-side API call.
   */
  protected static async callApi<T>(params: {
    type: ApiRequestDataTypeInterface;
    method: ClientHttpMethod;
    endpoint: string;
    companyId?: string;
    input?: any;
    overridesJsonApiCreation?: boolean;
    next?: ClientNextRef;
    previous?: ClientPreviousRef;
    self?: ClientSelfRef;
    responseType?: ApiRequestDataTypeInterface;
    files?: { [key: string]: File | Blob } | File | Blob;
  }): Promise<T> {
    let apiResponse: ApiResponseInterface;

    // Client-side: extract locale from URL pathname
    const language = this.getClientLocale();

    switch (params.method) {
      case ClientHttpMethod.GET:
        apiResponse = await ClientJsonApiGet({
          classKey: params.type,
          endpoint: params.endpoint,
          companyId: params.companyId,
          language: language,
        });
        break;
      case ClientHttpMethod.POST:
        apiResponse = await ClientJsonApiPost({
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
      case ClientHttpMethod.PUT:
        apiResponse = await ClientJsonApiPut({
          classKey: params.type,
          endpoint: params.endpoint,
          companyId: params.companyId,
          body: params.input,
          language: language,
          responseType: params.responseType,
          files: params.files,
        });
        break;
      case ClientHttpMethod.PATCH:
        apiResponse = await ClientJsonApiPatch({
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
      case ClientHttpMethod.DELETE:
        apiResponse = await ClientJsonApiDelete({
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
      if (globalErrorHandler) {
        globalErrorHandler(apiResponse.response, apiResponse.error);
        return undefined as any;
      } else {
        const error = new Error(`${apiResponse.response}:${apiResponse.error}`) as any;
        error.status = apiResponse.response;
        error.digest = `HTTP_${apiResponse.response}`;
        throw error;
      }
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
    method: ClientHttpMethod;
    endpoint: string;
    companyId?: string;
  }): Promise<any> {
    const language = this.getClientLocale();

    const apiResponse: ApiResponseInterface = await ClientJsonApiGet({
      classKey: params.type,
      endpoint: params.endpoint,
      companyId: params.companyId,
      language: language,
    });

    if (!apiResponse.ok) {
      if (globalErrorHandler) {
        globalErrorHandler(apiResponse.response, apiResponse.error);
        return undefined as any;
      } else {
        const error = new Error(`${apiResponse.response}:${apiResponse.error}`) as any;
        error.status = apiResponse.response;
        error.digest = `HTTP_${apiResponse.response}`;
        throw error;
      }
    }

    return apiResponse.raw;
  }
}
