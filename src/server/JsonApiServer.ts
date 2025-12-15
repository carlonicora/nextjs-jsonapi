// Server-only utilities (NOT server actions - these cannot be called from client components)

import { JsonApiDataFactory } from "../core/factories/JsonApiDataFactory";
import { ApiRequestDataTypeInterface } from "../core/interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../core/interfaces/ApiResponseInterface";
import { translateResponse } from "../core/utils/translateResponse";
import { ModuleWithPermissions } from "../permissions/types";
import { serverRequest } from "./request";
import { getServerToken } from "./token";

// Config storage for server contexts
let _serverConfig: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
  bootstrapper?: () => void;
  additionalHeaders?: Record<string, string>;
} | null = null;

/**
 * Configure the JSON:API server client.
 * Call this in your Bootstrapper or server initialization.
 */
export function configureServerJsonApi(config: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
  bootstrapper?: () => void;
  additionalHeaders?: Record<string, string>;
}): void {
  _serverConfig = config;
  if (config.bootstrapper) {
    config.bootstrapper();
  }
}

export function getServerApiUrl(): string {
  if (_serverConfig?.apiUrl) {
    return _serverConfig.apiUrl;
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    throw new Error("API URL not configured. Use configureServerJsonApi() or set NEXT_PUBLIC_API_URL environment variable.");
  }
  return envUrl;
}

export function getServerAppUrl(): string {
  if (_serverConfig?.appUrl) {
    return _serverConfig.appUrl;
  }
  const envUrl = process.env.NEXT_PUBLIC_ADDRESS;
  if (!envUrl) {
    throw new Error("App URL not configured. Use configureServerJsonApi({ appUrl }) or set NEXT_PUBLIC_ADDRESS environment variable.");
  }
  return envUrl.trim().replace(/\/+$/, "");
}

export function getServerTrackablePages(): ModuleWithPermissions[] {
  return _serverConfig?.trackablePages ?? [];
}

function runServerBootstrapper(): void {
  if (_serverConfig?.bootstrapper) {
    _serverConfig.bootstrapper();
  }
}

function buildServerUrl(endpoint: string): string {
  const apiUrl = getServerApiUrl();
  return endpoint.startsWith("http") ? endpoint : `${apiUrl}${endpoint}`;
}

export async function ServerJsonApiGet(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  language: string;
}): Promise<ApiResponseInterface> {
  runServerBootstrapper();
  const token = await getServerToken();

  const apiResponse = await serverRequest({
    method: "GET",
    url: buildServerUrl(params.endpoint),
    token,
    cache: params.classKey.cache,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _serverConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
    paginationHandler: async (endpoint: string) =>
      ServerJsonApiGet({
        classKey: params.classKey,
        endpoint,
        companyId: params.companyId,
        language: params.language,
      }),
  });
}

export async function ServerJsonApiPost(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  overridesJsonApiCreation?: boolean;
  files?: { [key: string]: File | Blob } | File | Blob;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
}): Promise<ApiResponseInterface> {
  runServerBootstrapper();
  const token = await getServerToken();

  let body = params.body;
  if (!body) {
    body = {};
  } else if (params.overridesJsonApiCreation !== true) {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await serverRequest({
    method: "POST",
    url: buildServerUrl(params.endpoint),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _serverConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function ServerJsonApiPut(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
}): Promise<ApiResponseInterface> {
  runServerBootstrapper();
  const token = await getServerToken();

  let body = params.body;
  if (!body) {
    body = {};
  } else {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await serverRequest({
    method: "PUT",
    url: buildServerUrl(params.endpoint),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _serverConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function ServerJsonApiPatch(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  overridesJsonApiCreation?: boolean;
  responseType?: ApiRequestDataTypeInterface;
  language: string;
}): Promise<ApiResponseInterface> {
  runServerBootstrapper();
  const token = await getServerToken();

  let body = params.body;
  if (!body) {
    body = {};
  } else if (params.overridesJsonApiCreation !== true) {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await serverRequest({
    method: "PATCH",
    url: buildServerUrl(params.endpoint),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _serverConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function ServerJsonApiDelete(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
}): Promise<ApiResponseInterface> {
  runServerBootstrapper();
  const token = await getServerToken();

  const apiResponse = await serverRequest({
    method: "DELETE",
    url: buildServerUrl(params.endpoint),
    token,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _serverConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}
