// Guard 3: pwa/sw.js is a plain service-worker script, so it is evaluated in a
// node:vm context whose global is a stubbed worker `self`. Nothing here touches
// the test realm's globals, so no vi.stubGlobal is needed.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

const SW_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../pwa/sw.js");
const SW_SOURCE = readFileSync(SW_PATH, "utf8");

const ORIGIN = "https://app.test";

type SwConfig = { appId: string; offlineRevision: string; notificationIcon: string };
type Listener = (event: any) => void;

// A worker resolves relative Request URLs against its own location; Node's
// Request has no base URL, so the sandbox gets a Request that adds one.
class WorkerRequest extends globalThis.Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === "string" ? new URL(input, ORIGIN) : input, init);
  }
}

function loadWorker(config: SwConfig = { appId: "test", offlineRevision: "abc12345", notificationIcon: "/icon.png" }) {
  const listeners: Record<string, Listener> = {};
  const sandbox: Record<string, any> = {
    importScripts: vi.fn((_url: string) => {
      sandbox.NJA_SW_CONFIG = config;
    }),
    addEventListener: vi.fn((type: string, listener: Listener) => {
      listeners[type] = listener;
    }),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn(), matchAll: vi.fn(), openWindow: vi.fn() },
    registration: {
      navigationPreload: { enable: vi.fn() },
      showNotification: vi.fn(),
      pushManager: { subscribe: vi.fn() },
    },
    caches: { open: vi.fn(), keys: vi.fn(), delete: vi.fn() },
    fetch: vi.fn(),
    Response: globalThis.Response,
    Request: WorkerRequest,
    location: { origin: ORIGIN },
    console,
  };
  sandbox.self = sandbox;

  vm.runInNewContext(SW_SOURCE, sandbox, { filename: SW_PATH });

  function dispatch(type: string, init: Record<string, any> = {}) {
    const listener = listeners[type];
    if (!listener) throw new Error(`no ${type} listener registered`);
    const event: Record<string, any> = {
      ...init,
      waitUntilPromise: undefined as Promise<unknown> | undefined,
      respondWithPromise: undefined as Promise<unknown> | undefined,
      waitUntil: vi.fn((p: Promise<unknown>) => {
        event.waitUntilPromise = p;
      }),
      respondWith: vi.fn((p: Promise<unknown>) => {
        event.respondWithPromise = p;
      }),
    };
    listener(event);
    return event;
  }

  return { sandbox, listeners, dispatch };
}

function makeCache(overrides: Record<string, any> = {}) {
  return {
    add: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    addAll: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function navigation(init: Record<string, any> = {}) {
  return {
    request: { mode: "navigate", destination: "document", url: `${ORIGIN}/campaigns` },
    preloadResponse: Promise.resolve(undefined),
    ...init,
  };
}

describe("pwa/sw.js", () => {
  it("imports /sw-config.js first", () => {
    const { sandbox } = loadWorker();

    expect(sandbox.importScripts).toHaveBeenCalledTimes(1);
    expect(sandbox.importScripts).toHaveBeenCalledWith("/sw-config.js");
    const importOrder = sandbox.importScripts.mock.invocationCallOrder[0];
    const firstListenerOrder = Math.min(...sandbox.addEventListener.mock.invocationCallOrder);
    expect(importOrder).toBeLessThan(firstListenerOrder);
  });

  it("install caches only /offline.html with cache: reload", async () => {
    const { sandbox, dispatch } = loadWorker();
    const cache = makeCache();
    sandbox.caches.open.mockResolvedValue(cache);

    const event = dispatch("install");
    await event.waitUntilPromise;

    expect(sandbox.caches.open).toHaveBeenCalledTimes(1);
    expect(sandbox.caches.open).toHaveBeenCalledWith("test-offline-abc12345");
    expect(cache.add).toHaveBeenCalledTimes(1);
    const request = cache.add.mock.calls[0][0];
    expect(new URL(request.url).pathname).toBe("/offline.html");
    expect(request.url.endsWith("/offline.html")).toBe(true);
    expect(request.cache).toBe("reload");
    expect(cache.put).not.toHaveBeenCalled();
    expect(cache.addAll).not.toHaveBeenCalled();
  });

  it("install fails when the offline page cannot be fetched", async () => {
    const { sandbox, dispatch } = loadWorker();
    const cache = makeCache({ add: vi.fn().mockRejectedValue(new Error("Request failed")) });
    sandbox.caches.open.mockResolvedValue(cache);

    const event = dispatch("install");

    await expect(event.waitUntilPromise).rejects.toThrow("Request failed");
  });

  it("activate deletes every other cache, enables navigation preload, claims clients", async () => {
    const { sandbox, dispatch } = loadWorker();
    sandbox.caches.keys.mockResolvedValue(["serwist-precache", "only35-images-v4", "test-offline-abc12345"]);
    sandbox.caches.delete.mockResolvedValue(true);
    sandbox.registration.navigationPreload.enable.mockResolvedValue(undefined);
    sandbox.clients.claim.mockResolvedValue(undefined);

    const event = dispatch("activate");
    await event.waitUntilPromise;

    expect(sandbox.caches.delete).toHaveBeenCalledTimes(2);
    expect(sandbox.caches.delete).toHaveBeenCalledWith("serwist-precache");
    expect(sandbox.caches.delete).toHaveBeenCalledWith("only35-images-v4");
    expect(sandbox.caches.delete).not.toHaveBeenCalledWith("test-offline-abc12345");
    expect(sandbox.registration.navigationPreload.enable).toHaveBeenCalledTimes(1);
    expect(sandbox.clients.claim).toHaveBeenCalledTimes(1);
  });

  it("does not call respondWith for a non-navigation request", () => {
    const { sandbox, dispatch } = loadWorker();

    const event = dispatch("fetch", {
      request: { mode: "no-cors", destination: "script", url: `${ORIGIN}/_next/static/chunk.js` },
    });

    expect(event.respondWith).not.toHaveBeenCalled();
    expect(sandbox.fetch).not.toHaveBeenCalled();
    expect(sandbox.caches.open).not.toHaveBeenCalled();
  });

  it("answers a navigation with the preload response when present", async () => {
    const { sandbox, dispatch } = loadWorker();
    const preload = new Response("preloaded", { status: 200 });

    const event = dispatch("fetch", navigation({ preloadResponse: Promise.resolve(preload) }));

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    expect(await event.respondWithPromise).toBe(preload);
    expect(sandbox.fetch).not.toHaveBeenCalled();
  });

  it("answers a navigation with the network response when there is no preload", async () => {
    const { sandbox, dispatch } = loadWorker();
    const network = new Response("network", { status: 200 });
    sandbox.fetch.mockResolvedValue(network);
    const init = navigation();

    const event = dispatch("fetch", init);

    expect(await event.respondWithPromise).toBe(network);
    expect(sandbox.fetch).toHaveBeenCalledTimes(1);
    expect(sandbox.fetch).toHaveBeenCalledWith(init.request);
    expect(sandbox.caches.open).not.toHaveBeenCalled();
  });

  it("passes a 500 and a redirect through unchanged", async () => {
    const { sandbox, dispatch } = loadWorker();
    const serverError = new Response("boom", { status: 500 });
    const redirect = Response.redirect(`${ORIGIN}/login`, 302);
    sandbox.fetch.mockResolvedValueOnce(serverError).mockResolvedValueOnce(redirect);

    const first = dispatch("fetch", navigation());
    const firstResponse = await first.respondWithPromise;
    const second = dispatch("fetch", navigation());
    const secondResponse = await second.respondWithPromise;

    expect(firstResponse).toBe(serverError);
    expect((firstResponse as Response).status).toBe(500);
    expect(secondResponse).toBe(redirect);
    expect((secondResponse as Response).status).toBe(302);
    expect(sandbox.caches.open).not.toHaveBeenCalled();
  });

  it("serves the cached offline page when the navigation fetch throws", async () => {
    const { sandbox, dispatch } = loadWorker();
    const offline = new Response("<!doctype html><title>Offline</title>", {
      headers: { "content-type": "text/html" },
    });
    const cache = makeCache({ match: vi.fn().mockResolvedValue(offline) });
    sandbox.caches.open.mockResolvedValue(cache);
    sandbox.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const event = dispatch("fetch", navigation());

    expect(await event.respondWithPromise).toBe(offline);
    expect(sandbox.caches.open).toHaveBeenCalledWith("test-offline-abc12345");
    expect(cache.match).toHaveBeenCalledWith("/offline.html");
  });

  it("serves the inline fallback when the fetch throws and the cache is empty", async () => {
    const { sandbox, dispatch } = loadWorker();
    const cache = makeCache({ match: vi.fn().mockResolvedValue(undefined) });
    sandbox.caches.open.mockResolvedValue(cache);
    sandbox.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const event = dispatch("fetch", navigation());
    const response = (await event.respondWithPromise) as Response;

    expect(response).toBeTruthy();
    expect(response.status).toBe(200);
    expect((response.headers.get("content-type") ?? "").startsWith("text/html")).toBe(true);
    const body = await response.text();
    expect(body).toContain("<!doctype html>");
  });

  it("calls skipWaiting on SKIP_WAITING and ignores other messages", () => {
    const { sandbox, dispatch } = loadWorker();

    dispatch("message", { data: { type: "SOMETHING_ELSE" } });
    dispatch("message", { data: null });
    dispatch("message", { data: "SKIP_WAITING" });
    expect(sandbox.skipWaiting).not.toHaveBeenCalled();

    dispatch("message", { data: { type: "SKIP_WAITING" } });
    expect(sandbox.skipWaiting).toHaveBeenCalledTimes(1);
  });

  it("shows a notification with the configured icon on push", async () => {
    const { sandbox, dispatch } = loadWorker();
    sandbox.registration.showNotification.mockResolvedValue(undefined);

    const event = dispatch("push", {
      data: { json: () => ({ title: "New session", message: "Friday at 8", url: "/sessions/1" }) },
    });
    await event.waitUntilPromise;

    expect(sandbox.registration.showNotification).toHaveBeenCalledTimes(1);
    const [title, options] = sandbox.registration.showNotification.mock.calls[0];
    expect(title).toBe("New session");
    expect(options.icon).toBe("/icon.png");
    expect(options.body).toBe("Friday at 8");
    expect(options.data).toBe("/sessions/1");
  });

  it("posts PUSH_RESUBSCRIBED to one client only, preferring a visible one", async () => {
    const { sandbox, dispatch } = loadWorker();
    const keys = { p256dh: "p256dh-key", auth: "auth-key" };
    sandbox.registration.pushManager.subscribe.mockResolvedValue({
      endpoint: "https://push.example/new",
      toJSON: () => ({ endpoint: "https://push.example/new", keys }),
    });
    const hidden = { visibilityState: "hidden", postMessage: vi.fn() };
    const visible = { visibilityState: "visible", postMessage: vi.fn() };
    sandbox.clients.matchAll.mockResolvedValue([hidden, visible]);

    const event = dispatch("pushsubscriptionchange", {
      oldSubscription: { options: { applicationServerKey: "server-key" } },
    });
    await event.waitUntilPromise;

    expect(sandbox.registration.pushManager.subscribe).toHaveBeenCalledTimes(1);
    const subscribeOptions = sandbox.registration.pushManager.subscribe.mock.calls[0][0];
    expect(subscribeOptions.userVisibleOnly).toBe(true);
    expect(subscribeOptions.applicationServerKey).toBe("server-key");

    expect(hidden.postMessage).not.toHaveBeenCalled();
    expect(visible.postMessage).toHaveBeenCalledTimes(1);
    const message = visible.postMessage.mock.calls[0][0];
    expect(message.type).toBe("PUSH_RESUBSCRIBED");
    expect(message.subscription.endpoint).toBe("https://push.example/new");
    expect(message.subscription.keys).toBe(keys);
    expect(Object.keys(message).sort()).toEqual(["subscription", "type"]);
    expect(Object.keys(message.subscription).sort()).toEqual(["endpoint", "keys"]);
  });

  it("does nothing on pushsubscriptionchange without an old subscription", async () => {
    const { sandbox, dispatch } = loadWorker();
    const client = { visibilityState: "visible", postMessage: vi.fn() };
    sandbox.clients.matchAll.mockResolvedValue([client]);

    const event = dispatch("pushsubscriptionchange", { oldSubscription: null });
    await event.waitUntilPromise;

    expect(sandbox.registration.pushManager.subscribe).not.toHaveBeenCalled();
    expect(sandbox.clients.matchAll).not.toHaveBeenCalled();
    expect(client.postMessage).not.toHaveBeenCalled();
  });
});
