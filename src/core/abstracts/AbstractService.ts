import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../interfaces/ApiResponseInterface";

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export interface NextRef {
  next?: string;
}

export interface PreviousRef {
  previous?: string;
}

export interface SelfRef {
  self?: string;
}

let globalErrorHandler: ((status: number, message: string) => void) | null = null;

/**
 * Set a global error handler for API errors (client-side only).
 * This handler will be called instead of throwing errors.
 */
export function setGlobalErrorHandler(handler: (status: number, message: string) => void) {
  globalErrorHandler = handler;
}

/**
 * Get the current global error handler.
 */
export function getGlobalErrorHandler(): ((status: number, message: string) => void) | null {
  return globalErrorHandler;
}

/**
 * Abstract base class for services that interact with the JSON:API.
 * Extend this class to create feature-specific services.
 */
export abstract class AbstractService {
  /**
   * Extract locale from client-side URL pathname
   * URL structure: /{locale}/route-path (e.g., /it/accounts)
   * Fallback chain: URL locale → navigator.language → "it"
   */
  private static getClientLocale(): string {
    if (typeof window === "undefined") {
      return "it"; // Server-side fallback
    }

    // Extract locale from URL pathname (first segment after leading slash)
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const urlLocale = pathSegments[0];

    // Validate against supported locales (currently only "it")
    const supportedLocales = ["it"];
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
   * Make an API call with automatic environment detection and error handling.
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
    // Dynamic import to avoid bundling issues
    const { JsonApiGet, JsonApiPost, JsonApiPut, JsonApiPatch, JsonApiDelete } =
      await import("../../unified/JsonApiRequest");

    let apiResponse: ApiResponseInterface;

    // Get language based on environment
    let language = "en";
    if (typeof window === "undefined") {
      const { getLocale } = await import("next-intl/server");
      language = (await getLocale()) ?? "it";
    } else {
      // Client-side: extract locale from URL pathname
      language = this.getClientLocale();
    }

    switch (params.method) {
      case HttpMethod.GET:
        apiResponse = await JsonApiGet({
          classKey: params.type,
          endpoint: params.endpoint,
          companyId: params.companyId,
          language: language,
        });
        break;
      case HttpMethod.POST:
        apiResponse = await JsonApiPost({
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
        apiResponse = await JsonApiPut({
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
        apiResponse = await JsonApiPatch({
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
        apiResponse = await JsonApiDelete({
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
      if (globalErrorHandler && typeof window !== "undefined") {
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
    method: HttpMethod;
    endpoint: string;
    companyId?: string;
  }): Promise<any> {
    const { JsonApiGet } = await import("../../unified/JsonApiRequest");

    let language = "en";

    if (typeof window === "undefined") {
      const { getLocale } = await import("next-intl/server");
      language = (await getLocale()) ?? "en";
    } else {
      // Client-side: extract locale from URL pathname
      language = this.getClientLocale();
    }

    const apiResponse: ApiResponseInterface = await JsonApiGet({
      classKey: params.type,
      endpoint: params.endpoint,
      companyId: params.companyId,
      language: language,
    });

    if (!apiResponse.ok) {
      if (globalErrorHandler && typeof window !== "undefined") {
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
