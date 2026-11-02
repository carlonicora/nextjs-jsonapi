"use client";

import { ApiData } from "../core/interfaces/ApiData";
import { isOfflineConfigured } from "../offline/config";
import { getOfflineState, reachesNetworkWhileOffline, setOfflineState } from "../offline/state";
import { OFFLINE_REPLAY_HEADER } from "../offline/types";

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
  // Offline mode is opt-in (`configureOffline`). Without it nothing below loads or runs. A request
  // the server runs as an offline replay always goes to the network, and so do the reads and the
  // change-set request of a reconnect attempt (the session stays offline until its sync succeeds).
  const offline = isOfflineConfigured() && !hasReplayHeader(params.additionalHeaders);
  if (offline && !getOfflineState().online && !reachesNetworkWhileOffline(params.method, params.url)) {
    return answerLocally(params);
  }

  const response = await fetchFromApi(params);

  if (offline && response.networkError) {
    setOfflineState({ online: false });
    return answerLocally(params);
  }
  if (offline && response.ok && params.method.toUpperCase() !== "GET") {
    const { writeThrough } = await import("../offline/write-through");
    await writeThrough({ method: params.method, url: params.url }, response);
  }

  return response;
}

function hasReplayHeader(headers?: Record<string, string>): boolean {
  if (!headers) return false;
  return Object.keys(headers).some((key) => key.toLowerCase() === OFFLINE_REPLAY_HEADER);
}

async function answerLocally(params: DirectFetchParams): Promise<ApiData> {
  const { localTransport } = await import("../offline/local-transport");
  return localTransport({ method: params.method, url: params.url, body: params.body, files: params.files });
}

async function fetchFromApi(params: DirectFetchParams): Promise<ApiData> {
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
    response.networkError = true;
  }

  return response;
}
