"use client";

import { ApiData } from "../core/interfaces/ApiData";

export interface DirectFetchParams {
  method: string;
  url: string;
  token?: string;
  body?: any;
  files?: { [key: string]: File | Blob } | File | Blob;
  companyId?: string;
  language: string;
  additionalHeaders?: Record<string, string>;
}

/**
 * Client-side direct fetch to bypass server action overhead.
 * Use this for client-side API calls.
 */
export async function directFetch(params: DirectFetchParams): Promise<ApiData> {
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
    } catch (error) {
      response.data = undefined;
    }
  } catch (error) {
    response.ok = false;
    response.status = 500;
    response.data = undefined;
  }

  return response;
}
