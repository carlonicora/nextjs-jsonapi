import { getClientApiUrl } from "../client/JsonApiClient";
import type { ApiData } from "../core/interfaces/ApiData";
import { getApiUrl } from "../unified/JsonApiRequest";
import { getOfflineConfig, getOfflineStore } from "./config";
import {
  buildGenericRoutes,
  rootIdForResource,
  isRootWriteLocked,
  needsConnectionAnswer,
  queuePath,
} from "./generic-answers";
import { matchRoute } from "./router";
import { setOfflineState } from "./state";
import type { DeviceStore } from "./store/DeviceStore";
import {
  NeedsConnectionError,
  type OfflineAnswer,
  type OfflineMethod,
  type OfflineRequest,
  type OfflineRoute,
} from "./types";

export type LocalTransportRequest = {
  method: string;
  url: string;
  body?: any;
  files?: unknown;
};

const METHODS: OfflineMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function apiBases(): string[] {
  const bases: string[] = [];
  for (const read of [getApiUrl, getClientApiUrl]) {
    try {
      const base = read();
      if (base) bases.push(base);
    } catch {
      // not configured on this side
    }
  }
  return bases;
}

/** The path relative to the API base, as `EndpointCreator` built it, and its query. */
export function splitApiUrl(url: string): { path: string; query: URLSearchParams } {
  let relative: string | undefined;
  for (const base of apiBases()) {
    if (url.startsWith(base)) {
      relative = url.slice(base.length);
      break;
    }
  }
  if (relative === undefined) {
    try {
      const parsed = new URL(url);
      relative = `${parsed.pathname}${parsed.search}`;
    } catch {
      relative = url;
    }
  }

  const [pathPart, ...queryParts] = relative.split("?");
  return {
    path: pathPart.replace(/^\/+/, "").replace(/\/+$/, ""),
    query: new URLSearchParams(queryParts.join("?")),
  };
}

function toApiData(answer: OfflineAnswer): ApiData {
  const ok = answer.status >= 200 && answer.status < 300;
  return {
    ok,
    status: answer.status,
    statusText: ok ? "OK" : answer.status === 503 ? "Service Unavailable" : "Error",
    data: answer.body,
  };
}

/** The root record a custom write belongs to: a `<root>/:param` capture, a stored record named by a param, or the body. */
async function rootIdForCustomWrite(
  store: DeviceStore,
  pattern: OfflineRequest,
  params: Record<string, string>,
  rootSegmentParam: string | undefined,
): Promise<string | undefined> {
  const config = getOfflineConfig();
  if (rootSegmentParam && params[rootSegmentParam]) return params[rootSegmentParam];

  for (const value of Object.values(params)) {
    for (const typeConfig of config.types) {
      const stored = await store.getRecord(typeConfig.module.name, value);
      if (stored?.rootId) return stored.rootId;
    }
  }
  return rootIdForResource(store, config, pattern.body?.data);
}

async function refreshPendingCount(store: DeviceStore): Promise<void> {
  const entries = await store.queue();
  setOfflineState({ pending: entries.filter((entry) => entry.status !== "conflict").length });
}

/**
 * Answers a request from the device copy: the app's custom routes first, then the generic ones.
 * The result has the `ApiData` shape `directFetch` returns, so `translateResponse` and
 * `rehydrate()` run unchanged.
 */
export async function localTransport(request: LocalTransportRequest): Promise<ApiData> {
  try {
    const method = request.method.toUpperCase() as OfflineMethod;
    if (!METHODS.includes(method)) return toApiData(needsConnectionAnswer());
    if (request.files) return toApiData(needsConnectionAnswer("Uploading files needs a connection"));

    const config = getOfflineConfig();
    const { path, query } = splitApiUrl(request.url);
    const offlineRequest: OfflineRequest = { method, path, query, body: request.body, url: request.url };

    const custom = matchRoute(config.routes, method, path);
    const match = custom ?? matchRoute(buildGenericRoutes(config), method, path);
    if (!match) return toApiData(needsConnectionAnswer(`${method} ${path} has no offline answer`));

    let store: DeviceStore;
    try {
      store = await getOfflineStore();
    } catch (error) {
      // The device copy cannot be opened here (another tab holds the file, storage refused,
      // no signed-in user): only the server can answer.
      if (error instanceof NeedsConnectionError) return toApiData(needsConnectionAnswer(error.message));
      console.warn("[offline] the device copy could not be opened", error);
      return toApiData(needsConnectionAnswer("The device copy is not available in this tab"));
    }
    const ctx = { request: offlineRequest, params: match.params, store };

    // The root record of a custom write (a `<root>/:param` capture, a stored record, or the body).
    const customRootId = async (route: OfflineRoute): Promise<string | undefined> => {
      const rootIndex = route.pattern.findIndex(
        (segment) => typeof segment !== "string" && segment.name === config.rootModule.name,
      );
      const next = rootIndex >= 0 ? route.pattern[rootIndex + 1] : undefined;
      const rootParam = typeof next === "string" && next.startsWith(":") ? next.slice(1) : undefined;
      return rootIdForCustomWrite(store, offlineRequest, match.params, rootParam);
    };

    if (!custom || !custom.route.queue) {
      // A custom write that is not queued is refused on a locked root record too (GETs stay allowed).
      if (custom && method !== "GET") {
        const rootId = await customRootId(custom.route);
        if (rootId && isRootWriteLocked(rootId)) {
          return toApiData(needsConnectionAnswer("The root record is locked"));
        }
      }
      const answer = await match.route.answer(ctx);
      if (method !== "GET") await refreshPendingCount(store);
      return toApiData(answer);
    }

    // A custom write the server must run too: refused on a locked root record, otherwise the answer
    // updates the device copy and the original request is queued in the same transaction.
    const rootId = await customRootId(custom.route);
    if (!rootId) return toApiData(needsConnectionAnswer(`${method} ${path} belongs to no root record on this device`));
    if (isRootWriteLocked(rootId)) return toApiData(needsConnectionAnswer("The root record is locked"));

    const answer = await store.transaction(async (transactionStore) => {
      const result = await custom.route.answer({ ...ctx, store: transactionStore });
      if (result.status >= 200 && result.status < 300) {
        await transactionStore.enqueue({
          rootId,
          method,
          path: queuePath(ctx),
          body: request.body,
          base: null,
        });
      }
      return result;
    });
    await refreshPendingCount(store);
    return toApiData(answer);
  } catch (error) {
    if (error instanceof NeedsConnectionError) return toApiData(needsConnectionAnswer(error.message));
    console.error("[offline] local answer failed", error);
    return toApiData({
      status: 500,
      body: {
        errors: [{ status: "500", title: "Offline answer failed", detail: String((error as Error)?.message ?? error) }],
      },
    });
  }
}
