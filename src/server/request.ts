// Server-only utilities (NOT server actions - these cannot be called from client components)

import { ApiData } from "../core/interfaces/ApiData";
// Through the package's own export, not "./cachedGet": the `react-server` condition gives
// server code the real `"use cache"` function and every other bundle a stub. A relative
// import would put `"use cache"` into the client bundles that reach this module.
import { cachedServerGet, statusFromDigest } from "@carlonicora/nextjs-jsonapi/cached-get";

export interface ServerRequestParams {
  method: string;
  url: string;
  token?: string;
  cache?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  companyId?: string;
  language: string;
  additionalHeaders?: Record<string, string>;
}

/**
 * Server-side request.
 *
 * - A GET with a `cache` value goes through `cachedServerGet`, a token-free `"use cache"`
 *   function. The token is never sent on that path.
 * - Everything else (uncached GET, POST, PUT, PATCH, DELETE) is a plain uncached `fetch`
 *   that sends the token.
 */
export async function serverRequest(params: ServerRequestParams): Promise<ApiData> {
  if (params.method === "GET" && params.cache) {
    try {
      return await cachedServerGet({
        url: params.url,
        cache: params.cache,
        language: params.language,
        companyId: params.companyId,
        additionalHeaders: params.additionalHeaders,
      });
    } catch (error) {
      // The cached function throws on failure so Next does not store it. Convert it back
      // here, outside the cache scope. In production only `digest` survives the boundary.
      const status = statusFromDigest(error) ?? 503;
      return {
        data: undefined,
        ok: false,
        status,
        statusText: status === 503 ? "Service Unavailable" : "",
      };
    }
  }

  const response: ApiData = {
    data: undefined,
    ok: false,
    status: 0,
    statusText: "",
  };

  const additionalHeaders: Record<string, string> = { ...params.additionalHeaders };

  if (params.companyId) {
    additionalHeaders["x-companyid"] = params.companyId;
  }
  additionalHeaders["x-language"] = params.language;

  let requestBody: BodyInit | undefined = undefined;

  if (params.files) {
    const formData = new FormData();
    if (params.body && typeof params.body === "object") {
      for (const key in params.body) {
        if (Object.prototype.hasOwnProperty.call(params.body, key)) {
          formData.append(
            key,
            typeof params.body[key] === "object" ? JSON.stringify(params.body[key]) : params.body[key],
          );
        }
      }
    }

    if (params.files instanceof Blob) {
      formData.append("file", params.files);
    } else if (typeof params.files === "object" && params.files !== null) {
      for (const key in params.files) {
        if (Object.prototype.hasOwnProperty.call(params.files, key)) {
          formData.append(key, params.files[key]);
        }
      }
    }

    requestBody = formData;
  } else if (params.body !== undefined) {
    requestBody = JSON.stringify(params.body);
    additionalHeaders["Content-Type"] = "application/json";
  }

  const options: RequestInit = {
    method: params.method,
    headers: { Accept: "application/json", ...additionalHeaders },
  };

  if (requestBody !== undefined) {
    options.body = requestBody;
  }

  if (params.token) {
    options.headers = { ...options.headers, Authorization: `Bearer ${params.token}` };
  }

  try {
    const apiResponse = await fetch(params.url, options);

    response.ok = apiResponse.ok;
    response.status = apiResponse.status;
    response.statusText = apiResponse.statusText;
    try {
      response.data = await apiResponse.json();
    } catch {
      response.data = undefined;
    }
  } catch {
    // fetch() only throws when the API could not be reached at all (server
    // down, DNS, connection refused). Report it as 503 so consumers can tell
    // "API unreachable" apart from a 500 the API actually returned.
    response.ok = false;
    response.status = 503;
    response.statusText = "Service Unavailable";
    response.data = undefined;
  }

  return response;
}
