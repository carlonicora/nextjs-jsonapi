import { JsonApiDataFactory } from "../core/factories/JsonApiDataFactory";
import { ApiData } from "../core/interfaces/ApiData";
import { ApiRequestDataTypeInterface } from "../core/interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../core/interfaces/ApiResponseInterface";
import { setBootstrapper } from "../core/registry/bootstrapStore";
import { translateResponse } from "../core/utils/translateResponse";
import { ModuleWithPermissions } from "../permissions/types";

// Type definitions for dynamically imported functions (avoiding typeof import to prevent bundling)
type DirectFetchFn = (params: {
  method: string;
  url: string;
  token?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  companyId?: string;
  language: string;
  additionalHeaders?: Record<string, string>;
}) => Promise<ApiData>;

type ServerRequestFn = (params: {
  method: string;
  url: string;
  token?: string;
  cache?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  companyId?: string;
  language: string;
  additionalHeaders?: Record<string, string>;
}) => Promise<ApiData>;

type GetTokenFn = () => Promise<string | undefined>;

// These will be dynamically imported based on environment
let _directFetch: DirectFetchFn;
let _serverRequest: ServerRequestFn;
let _getClientToken: GetTokenFn;
let _getServerToken: GetTokenFn;

// Config storage for non-React contexts
let _staticConfig: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
  bootstrapper?: () => void;
  additionalHeaders?: Record<string, string>;
} | null = null;

/**
 * Configure the JSON:API client for non-React contexts (e.g., server components).
 * For React contexts, use JsonApiProvider instead.
 */
export function configureJsonApi(config: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
  bootstrapper?: () => void;
  additionalHeaders?: Record<string, string>;
}): void {
  _staticConfig = config;
  // Register and call bootstrapper to register all modules
  if (config.bootstrapper) {
    setBootstrapper(config.bootstrapper);
    config.bootstrapper();
  }
}

async function getToken(): Promise<string | undefined> {
  if (typeof window === "undefined") {
    // Server-side
    if (!_getServerToken) {
      const serverModule = await import("../server/token");
      _getServerToken = serverModule.getServerToken;
    }
    return _getServerToken();
  } else {
    // Client-side
    if (!_getClientToken) {
      const clientModule = await import("../client/token");
      _getClientToken = clientModule.getClientToken;
    }
    return _getClientToken();
  }
}

async function makeRequest(params: {
  method: string;
  url: string;
  token?: string;
  cache?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  companyId?: string;
  language: string;
  additionalHeaders?: Record<string, string>;
}): Promise<ApiData> {
  if (typeof window !== "undefined") {
    // Client-side: use direct fetch
    if (!_directFetch) {
      const clientModule = await import("../client/request");
      _directFetch = clientModule.directFetch;
    }
    return _directFetch({
      method: params.method,
      url: params.url,
      token: params.token,
      body: params.body,
      files: params.files,
      companyId: params.companyId,
      language: params.language,
      additionalHeaders: params.additionalHeaders,
    });
  } else {
    // Server-side: use server request with caching
    if (!_serverRequest) {
      const serverModule = await import("../server/request");
      _serverRequest = serverModule.serverRequest;
    }
    return _serverRequest({
      method: params.method,
      url: params.url,
      token: params.token,
      cache: params.cache,
      body: params.body,
      files: params.files,
      companyId: params.companyId,
      language: params.language,
      additionalHeaders: params.additionalHeaders,
    });
  }
}

export function getApiUrl(): string {
  if (_staticConfig?.apiUrl) {
    return _staticConfig.apiUrl;
  }
  // Fallback to environment variable
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    throw new Error("API URL not configured. Use configureJsonApi() or set NEXT_PUBLIC_API_URL environment variable.");
  }
  return envUrl;
}

export function getAppUrl(): string {
  if (_staticConfig?.appUrl) {
    return _staticConfig.appUrl;
  }
  // Fallback to environment variable
  const envUrl = process.env.NEXT_PUBLIC_ADDRESS;
  if (!envUrl) {
    throw new Error(
      "App URL not configured. Use configureJsonApi({ appUrl }) or set NEXT_PUBLIC_ADDRESS environment variable.",
    );
  }
  return envUrl.trim().replace(/\/+$/, "");
}

export function getTrackablePages(): ModuleWithPermissions[] {
  return _staticConfig?.trackablePages ?? [];
}

function runBootstrapper(): void {
  if (_staticConfig?.bootstrapper) {
    _staticConfig.bootstrapper();
  }
}

/**
 * Resolve the final request URL for an endpoint.
 *
 * - `endpoint` starting with "http" is always passed through unchanged (existing behaviour).
 * - Otherwise, an explicit `baseUrl` (per-call override) takes precedence over the global
 *   `getApiUrl()` resolution. Omitting `baseUrl` preserves today's behaviour exactly.
 */
export function buildUrl(endpoint: string, baseUrl?: string): string {
  if (endpoint.startsWith("http")) return endpoint;
  const apiUrl = baseUrl ?? getApiUrl();
  return `${apiUrl}${endpoint}`;
}

export async function JsonApiGet(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  language: string;
  token?: string;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runBootstrapper();
  const token = params.token ?? (await getToken());

  const apiResponse = await makeRequest({
    method: "GET",
    url: buildUrl(params.endpoint, params.baseUrl),
    token,
    cache: params.classKey.cache,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _staticConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
    paginationHandler: async (endpoint: string) =>
      JsonApiGet({
        classKey: params.classKey,
        endpoint,
        companyId: params.companyId,
        language: params.language,
        token: params.token,
        baseUrl: params.baseUrl,
      }),
  });
}

export async function JsonApiPost(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  overridesJsonApiCreation?: boolean;
  files?: { [key: string]: File | Blob } | File | Blob;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
  token?: string;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runBootstrapper();
  const token = params.token ?? (await getToken());

  let body = params.body;
  if (!body) {
    body = {};
  } else if (params.overridesJsonApiCreation !== true) {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await makeRequest({
    method: "POST",
    url: buildUrl(params.endpoint, params.baseUrl),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _staticConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function JsonApiPut(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
  token?: string;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runBootstrapper();
  const token = params.token ?? (await getToken());

  let body = params.body;
  if (!body) {
    body = {};
  } else {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await makeRequest({
    method: "PUT",
    url: buildUrl(params.endpoint, params.baseUrl),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _staticConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function JsonApiPatch(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  overridesJsonApiCreation?: boolean;
  responseType?: ApiRequestDataTypeInterface;
  language: string;
  token?: string;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runBootstrapper();
  const token = params.token ?? (await getToken());

  let body = params.body;
  if (!body) {
    body = {};
  } else if (params.overridesJsonApiCreation !== true) {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await makeRequest({
    method: "PATCH",
    url: buildUrl(params.endpoint, params.baseUrl),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _staticConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function JsonApiDelete(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
  token?: string;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runBootstrapper();
  const token = params.token ?? (await getToken());

  const apiResponse = await makeRequest({
    method: "DELETE",
    url: buildUrl(params.endpoint, params.baseUrl),
    token,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _staticConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}
