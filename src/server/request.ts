"use server";

import { ApiData } from "../core/interfaces/ApiData";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

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
 * Server-side request with Next.js caching support.
 * Uses "use cache" directive for automatic caching.
 */
export async function serverRequest(params: ServerRequestParams): Promise<ApiData> {
  "use cache";

  const response: ApiData = {
    data: undefined,
    ok: false,
    status: 0,
    statusText: "",
  };

  // Apply caching configuration
  if (params.cache) {
    if (["days", "default", "hours", "max", "minutes", "seconds", "weeks"].includes(params.cache)) {
      cacheLife(params.cache as any);
    } else {
      cacheTag(params.cache);
    }
  } else {
    cacheLife("seconds");
  }

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
    response.ok = false;
    response.status = 500;
    response.data = undefined;
  }

  return response;
}
