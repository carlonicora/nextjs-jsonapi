"use client";

import { JsonApiDataFactory } from "../core/factories/JsonApiDataFactory";
import { ApiRequestDataTypeInterface } from "../core/interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../core/interfaces/ApiResponseInterface";
import { setBootstrapper } from "../core/registry/bootstrapStore";
import { translateResponse } from "../core/utils/translateResponse";
import { ModuleWithPermissions } from "../permissions/types";
import { directFetch } from "./request";
import { getClientToken } from "./token";

// Config storage for client contexts
let _clientConfig: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
  bootstrapper?: () => void;
  additionalHeaders?: Record<string, string>;
} | null = null;

/**
 * Configure the JSON:API client for browser contexts.
 * Call this in your client-side initialization or use JsonApiProvider.
 */
export function configureClientJsonApi(config: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
  bootstrapper?: () => void;
  additionalHeaders?: Record<string, string>;
}): void {
  _clientConfig = config;
  if (config.bootstrapper) {
    setBootstrapper(config.bootstrapper);
    config.bootstrapper();
  }
}

export function getClientApiUrl(): string {
  if (_clientConfig?.apiUrl) {
    return _clientConfig.apiUrl;
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    throw new Error(
      "API URL not configured. Use configureClientJsonApi() or set NEXT_PUBLIC_API_URL environment variable.",
    );
  }
  return envUrl;
}

export function getClientAppUrl(): string {
  if (_clientConfig?.appUrl) {
    return _clientConfig.appUrl;
  }
  const envUrl = process.env.NEXT_PUBLIC_ADDRESS;
  if (!envUrl) {
    throw new Error(
      "App URL not configured. Use configureClientJsonApi({ appUrl }) or set NEXT_PUBLIC_ADDRESS environment variable.",
    );
  }
  return envUrl.trim().replace(/\/+$/, "");
}

export function getClientTrackablePages(): ModuleWithPermissions[] {
  return _clientConfig?.trackablePages ?? [];
}

function runClientBootstrapper(): void {
  if (_clientConfig?.bootstrapper) {
    _clientConfig.bootstrapper();
  }
}

/**
 * Resolve the final request URL for an endpoint (client-side variant of `buildUrl`
 * in `unified/JsonApiRequest.ts` — kept in lockstep with it).
 *
 * - `endpoint` starting with "http" is always passed through unchanged (existing behaviour).
 * - Otherwise, an explicit `baseUrl` (per-call override) takes precedence over the global
 *   `getClientApiUrl()` resolution. Omitting `baseUrl` preserves today's behaviour exactly.
 */
export function buildClientUrl(endpoint: string, baseUrl?: string): string {
  if (endpoint.startsWith("http")) return endpoint;
  const apiUrl = baseUrl ?? getClientApiUrl();
  return `${apiUrl}${endpoint}`;
}

export async function ClientJsonApiGet(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  language: string;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runClientBootstrapper();
  const token = await getClientToken();

  const apiResponse = await directFetch({
    method: "GET",
    url: buildClientUrl(params.endpoint, params.baseUrl),
    token,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _clientConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
    paginationHandler: async (endpoint: string) =>
      ClientJsonApiGet({
        classKey: params.classKey,
        endpoint,
        companyId: params.companyId,
        language: params.language,
        baseUrl: params.baseUrl,
      }),
  });
}

export async function ClientJsonApiPost(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  overridesJsonApiCreation?: boolean;
  files?: { [key: string]: File | Blob } | File | Blob;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runClientBootstrapper();
  const token = await getClientToken();

  let body = params.body;
  if (!body) {
    body = {};
  } else if (params.overridesJsonApiCreation !== true) {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await directFetch({
    method: "POST",
    url: buildClientUrl(params.endpoint, params.baseUrl),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _clientConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function ClientJsonApiPut(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runClientBootstrapper();
  const token = await getClientToken();

  let body = params.body;
  if (!body) {
    body = {};
  } else {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await directFetch({
    method: "PUT",
    url: buildClientUrl(params.endpoint, params.baseUrl),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _clientConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function ClientJsonApiPatch(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  overridesJsonApiCreation?: boolean;
  responseType?: ApiRequestDataTypeInterface;
  language: string;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runClientBootstrapper();
  const token = await getClientToken();

  let body = params.body;
  if (!body) {
    body = {};
  } else if (params.overridesJsonApiCreation !== true) {
    body = JsonApiDataFactory.create(params.classKey, body);
  }

  const apiResponse = await directFetch({
    method: "PATCH",
    url: buildClientUrl(params.endpoint, params.baseUrl),
    token,
    body,
    files: params.files,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _clientConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}

export async function ClientJsonApiDelete(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  language: string;
  responseType?: ApiRequestDataTypeInterface;
  baseUrl?: string;
}): Promise<ApiResponseInterface> {
  runClientBootstrapper();
  const token = await getClientToken();

  const apiResponse = await directFetch({
    method: "DELETE",
    url: buildClientUrl(params.endpoint, params.baseUrl),
    token,
    companyId: params.companyId,
    language: params.language,
    additionalHeaders: _clientConfig?.additionalHeaders,
  });

  return translateResponse({
    classKey: params.responseType ?? params.classKey,
    apiResponse,
    companyId: params.companyId,
    language: params.language,
  });
}
