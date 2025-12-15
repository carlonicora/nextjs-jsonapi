// Server-only utilities (NOT server actions - these cannot be called from client components)

import { ApiData } from "../core/interfaces/ApiData";

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

// Map cache configuration names to revalidation times in seconds
const cacheLifeToSeconds: Record<string, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  max: 31536000, // 1 year
  default: 60,
};

/**
 * Server-side request with Next.js caching support.
 * Uses fetch's native caching options for Next.js compatibility.
 */
export async function serverRequest(params: ServerRequestParams): Promise<ApiData> {
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

  // Build Next.js fetch caching options
  const nextOptions: { revalidate?: number; tags?: string[] } = {};

  if (params.cache) {
    // Check if it's a predefined cache life name
    if (params.cache in cacheLifeToSeconds) {
      nextOptions.revalidate = cacheLifeToSeconds[params.cache];
    } else {
      // Treat as a cache tag
      nextOptions.tags = [params.cache];
      nextOptions.revalidate = 60; // Default revalidation time for tagged caches
    }
  } else {
    // Default to short caching
    nextOptions.revalidate = 1;
  }

  const options: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method: params.method,
    headers: { Accept: "application/json", ...additionalHeaders },
    next: nextOptions,
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
    response.ok = false;
    response.status = 500;
    response.data = undefined;
  }

  return response;
}
