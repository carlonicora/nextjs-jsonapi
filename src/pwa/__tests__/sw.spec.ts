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

type SwConfig = {
  appId: string;
  offlineRevision: string;
  notificationIcon: string;
  offlineShell?: { default: string; locales?: Record<string, string> };
  offlineImageHosts?: string[];
};
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
    URL: globalThis.URL,
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

const SHELL_CONFIG: SwConfig = {
  appId: "test",
  offlineRevision: "abc12345",
  notificationIcon: "/icon.png",
  offlineShell: { default: "/offline-shell", locales: { it: "/it/offline-shell" } },
  offlineImageHosts: ["api.app.test"],
};

/** The entry the worker writes last into a shell cache; a cache without it is incomplete. */
const SHELL_COMPLETE_URL = "/__nja-offline-shell-complete__";

const MANIFEST = { buildId: "build-2", assets: ["/_next/static/chunks/a.js", "/_next/static/css/b.css"] };

function manifestResponse(manifest = MANIFEST) {
  return new Response(JSON.stringify(manifest), { status: 200, headers: { "content-type": "application/json" } });
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

  describe("offline shell (opt-in)", () => {
    it("without offlineShell, install caches only /offline.html (unchanged)", async () => {
      const { sandbox, dispatch } = loadWorker();
      const cache = makeCache();
      sandbox.caches.open.mockResolvedValue(cache);

      const event = dispatch("install");
      await event.waitUntilPromise;

      expect(sandbox.fetch).not.toHaveBeenCalled();
      expect(sandbox.caches.open).toHaveBeenCalledTimes(1);
      expect(sandbox.caches.open).toHaveBeenCalledWith("test-offline-abc12345");
      expect(cache.addAll).not.toHaveBeenCalled();
    });

    it("with offlineShell, install reads /offline-manifest.json and caches every asset plus each shell URL in <appId>-shell-<buildId>", async () => {
      const { sandbox, dispatch } = loadWorker(SHELL_CONFIG);
      const offlineCache = makeCache();
      const shellCache = makeCache();
      sandbox.caches.open.mockImplementation(async (name: string) =>
        name === "test-shell-build-2" ? shellCache : offlineCache,
      );
      sandbox.fetch.mockResolvedValue(manifestResponse());

      const event = dispatch("install");
      await event.waitUntilPromise;

      expect(sandbox.fetch).toHaveBeenCalledTimes(1);
      const manifestRequest = sandbox.fetch.mock.calls[0][0];
      expect(new URL(manifestRequest.url).pathname).toBe("/offline-manifest.json");
      expect(manifestRequest.cache).toBe("no-store");
      expect(offlineCache.add).toHaveBeenCalledTimes(1);
      expect(sandbox.caches.open).toHaveBeenCalledWith("test-shell-build-2");
      expect(shellCache.addAll).toHaveBeenCalledTimes(1);
      const cached = shellCache.addAll.mock.calls[0][0].map((request: Request) => new URL(request.url).pathname);
      expect(cached.sort()).toEqual(
        ["/_next/static/chunks/a.js", "/_next/static/css/b.css", "/offline-shell", "/it/offline-shell"].sort(),
      );
      for (const request of shellCache.addAll.mock.calls[0][0]) expect(request.cache).toBe("reload");
      // The completion marker is written last, after every file is in.
      expect(shellCache.put).toHaveBeenCalledTimes(1);
      expect(shellCache.put.mock.calls[0][0]).toBe(SHELL_COMPLETE_URL);
      expect(shellCache.put.mock.invocationCallOrder[0]).toBeGreaterThan(shellCache.addAll.mock.invocationCallOrder[0]);
    });

    it("install fails, and the old worker stays, when any asset fails", async () => {
      const { sandbox, dispatch } = loadWorker(SHELL_CONFIG);
      const offlineCache = makeCache();
      const shellCache = makeCache({ addAll: vi.fn().mockRejectedValue(new Error("Request failed")) });
      sandbox.caches.open.mockImplementation(async (name: string) =>
        name === "test-shell-build-2" ? shellCache : offlineCache,
      );
      sandbox.caches.delete.mockResolvedValue(true);
      sandbox.fetch.mockResolvedValue(manifestResponse());

      const event = dispatch("install");

      await expect(event.waitUntilPromise).rejects.toThrow("Request failed");
      // The half-filled shell cache is deleted, so no worker ever picks it.
      expect(sandbox.caches.delete).toHaveBeenCalledWith("test-shell-build-2");
      expect(shellCache.put).not.toHaveBeenCalled();
    });

    it("never answers from a shell cache that is not complete (no completion marker)", async () => {
      const complete = new Response("build-2 shell");
      const partial = new Response("build-3 shell");
      const { sandbox, dispatch } = loadWorker(SHELL_CONFIG);
      const caches: Record<string, ReturnType<typeof makeCache>> = {
        "test-offline-abc12345": makeCache(),
        "test-shell-build-2": makeCache({
          match: vi.fn(async (url: string) =>
            url === SHELL_COMPLETE_URL ? new Response("") : url === "/offline-shell" ? complete : undefined,
          ),
        }),
        "test-shell-build-3": makeCache({
          match: vi.fn(async (url: string) => (url === "/offline-shell" ? partial : undefined)),
        }),
      };
      sandbox.caches.keys.mockResolvedValue(Object.keys(caches));
      sandbox.caches.open.mockImplementation(async (name: string) => caches[name]);
      sandbox.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const event = dispatch("fetch", navigation());

      expect(await event.respondWithPromise).toBe(complete);
    });

    it("install fails when the manifest cannot be read", async () => {
      const { sandbox, dispatch } = loadWorker(SHELL_CONFIG);
      sandbox.caches.open.mockResolvedValue(makeCache());
      sandbox.fetch.mockResolvedValue(new Response("nope", { status: 404 }));

      const event = dispatch("install");

      await expect(event.waitUntilPromise).rejects.toThrow();
    });

    it("activate deletes shell caches of other build ids and keeps <appId>-images", async () => {
      const { sandbox, dispatch } = loadWorker(SHELL_CONFIG);
      sandbox.caches.open.mockResolvedValue(makeCache());
      sandbox.fetch.mockResolvedValue(manifestResponse());
      await dispatch("install").waitUntilPromise;

      sandbox.caches.keys.mockResolvedValue([
        "test-offline-abc12345",
        "test-shell-build-1",
        "test-shell-build-2",
        "test-images",
        "serwist-precache",
      ]);
      sandbox.caches.delete.mockResolvedValue(true);
      sandbox.registration.navigationPreload.enable.mockResolvedValue(undefined);
      sandbox.clients.claim.mockResolvedValue(undefined);

      await dispatch("activate").waitUntilPromise;

      const deleted = sandbox.caches.delete.mock.calls.map((call: any[]) => call[0]).sort();
      expect(deleted).toEqual(["serwist-precache", "test-shell-build-1"]);
      expect(sandbox.clients.claim).toHaveBeenCalledTimes(1);
    });

    it("activate without offlineShell still deletes the images and shell caches (unchanged)", async () => {
      const { sandbox, dispatch } = loadWorker();
      sandbox.caches.keys.mockResolvedValue(["test-offline-abc12345", "test-shell-build-1", "test-images"]);
      sandbox.caches.delete.mockResolvedValue(true);

      await dispatch("activate").waitUntilPromise;

      const deleted = sandbox.caches.delete.mock.calls.map((call: any[]) => call[0]).sort();
      expect(deleted).toEqual(["test-images", "test-shell-build-1"]);
    });

    function shellWorker(shellEntries: Record<string, Response | undefined>, offlinePage?: Response) {
      const worker = loadWorker(SHELL_CONFIG);
      const entries: Record<string, Response | undefined> = { [SHELL_COMPLETE_URL]: new Response(""), ...shellEntries };
      const shellCache = makeCache({ match: vi.fn(async (url: string) => entries[url]) });
      const offlineCache = makeCache({ match: vi.fn().mockResolvedValue(offlinePage) });
      worker.sandbox.caches.keys.mockResolvedValue(["test-offline-abc12345", "test-shell-build-2"]);
      worker.sandbox.caches.open.mockImplementation(async (name: string) =>
        name === "test-shell-build-2" ? shellCache : offlineCache,
      );
      worker.sandbox.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
      return { ...worker, shellCache, offlineCache };
    }

    it("a failed navigation to /it/... answers the it shell, any other path the default shell, and offline.html when no shell is cached", async () => {
      const itShell = new Response("it shell");
      const defaultShell = new Response("default shell");
      const offline = new Response("offline page");

      const withShell = shellWorker({ "/offline-shell": defaultShell, "/it/offline-shell": itShell });
      const itNav = withShell.dispatch(
        "fetch",
        navigation({ request: { mode: "navigate", destination: "document", url: `${ORIGIN}/it/campaigns/c1/run` } }),
      );
      expect(await itNav.respondWithPromise).toBe(itShell);
      const defaultNav = withShell.dispatch(
        "fetch",
        navigation({ request: { mode: "navigate", destination: "document", url: `${ORIGIN}/npcs/n1` } }),
      );
      expect(await defaultNav.respondWithPromise).toBe(defaultShell);

      const noShell = shellWorker({}, offline);
      const fallback = noShell.dispatch("fetch", navigation());
      expect(await fallback.respondWithPromise).toBe(offline);
      expect(noShell.offlineCache.match).toHaveBeenCalledWith("/offline.html");
    });

    it("after an online navigation, a new build in the manifest refreshes the shell in the background and drops the old one; the same build does nothing", async () => {
      const { sandbox, dispatch } = loadWorker(SHELL_CONFIG);
      // The worker runs on build-1; the server now serves build-2.
      const caches = new Map<string, ReturnType<typeof makeCache>>();
      const complete = makeCache({
        match: vi.fn(async (url: string) => (url === SHELL_COMPLETE_URL ? new Response("") : undefined)),
      });
      caches.set("test-shell-build-1", complete);
      sandbox.caches.keys.mockImplementation(async () => [...caches.keys()]);
      sandbox.caches.open.mockImplementation(async (name: string) => {
        if (!caches.has(name)) caches.set(name, makeCache());
        return caches.get(name);
      });
      sandbox.caches.delete.mockImplementation(async (name: string) => caches.delete(name));
      const page = new Response("page");
      sandbox.fetch.mockImplementation(async (input: any) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.endsWith("/offline-manifest.json")) return manifestResponse();
        return page;
      });

      const event = dispatch("fetch", navigation());
      expect(await event.respondWithPromise).toBe(page);
      await event.waitUntilPromise;

      const fresh = caches.get("test-shell-build-2");
      expect(fresh?.addAll).toHaveBeenCalledTimes(1);
      expect(fresh?.put).toHaveBeenCalledWith(SHELL_COMPLETE_URL, expect.anything());
      expect(caches.has("test-shell-build-1")).toBe(false);

      // Same build: no second precache.
      fresh?.match.mockImplementation(async (url: string) =>
        url === SHELL_COMPLETE_URL ? new Response("") : undefined,
      );
      const again = dispatch("fetch", navigation());
      await again.respondWithPromise;
      await again.waitUntilPromise;
      expect(fresh?.addAll).toHaveBeenCalledTimes(1);
    });

    it("a GET under /_next/static/ is served cache-first from the shell cache", async () => {
      const cachedChunk = new Response("cached chunk");
      const { sandbox, dispatch } = shellWorker({ [`${ORIGIN}/_next/static/chunks/a.js`]: cachedChunk });

      const hit = dispatch("fetch", {
        request: { method: "GET", mode: "no-cors", destination: "script", url: `${ORIGIN}/_next/static/chunks/a.js` },
      });
      expect(hit.respondWith).toHaveBeenCalledTimes(1);
      expect(await hit.respondWithPromise).toBe(cachedChunk);
      expect(sandbox.fetch).not.toHaveBeenCalled();

      const network = new Response("network chunk");
      sandbox.fetch.mockResolvedValue(network);
      const missRequest = {
        method: "GET",
        mode: "no-cors",
        destination: "script",
        url: `${ORIGIN}/_next/static/chunks/missing.js`,
      };
      const miss = dispatch("fetch", { request: missRequest });
      expect(await miss.respondWithPromise).toBe(network);
      expect(sandbox.fetch).toHaveBeenCalledWith(missRequest);
    });

    it("another same-origin GET in the shell cache (the device worker, SQLite) goes to the network first and is answered from the cache when the network fails", async () => {
      const workerUrl = `${ORIGIN}/offline-sqlite/device-worker.mjs`;
      const cachedWorker = new Response("cached worker");
      const { sandbox, dispatch } = shellWorker({ [workerUrl]: cachedWorker });
      const request = { method: "GET", mode: "same-origin", destination: "worker", url: workerUrl };

      const online = new Response("network worker");
      sandbox.fetch.mockResolvedValue(online);
      const onlineEvent = dispatch("fetch", { request });
      expect(onlineEvent.respondWith).toHaveBeenCalledTimes(1);
      expect(await onlineEvent.respondWithPromise).toBe(online);

      sandbox.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
      const offlineEvent = dispatch("fetch", { request });
      expect(await offlineEvent.respondWithPromise).toBe(cachedWorker);

      const notCached = dispatch("fetch", {
        request: { method: "GET", mode: "cors", destination: "", url: `${ORIGIN}/campaigns?_rsc=1` },
      });
      // Not in the shell: a plain network error for the page, never an uncaught rejection in the worker.
      expect(((await notCached.respondWithPromise) as Response).type).toBe("error");
    });

    it("a no-store GET (the session refresh of the shell) is never answered from the cache: it goes to the network untouched", async () => {
      const cachedShell = new Response("cached shell");
      const { sandbox, dispatch } = shellWorker({
        "/offline-shell": cachedShell,
        [`${ORIGIN}/offline-shell`]: cachedShell,
      });

      const event = dispatch("fetch", {
        request: { method: "GET", mode: "cors", cache: "no-store", destination: "", url: `${ORIGIN}/offline-shell` },
      });

      expect(event.respondWith).not.toHaveBeenCalled();
      expect(sandbox.fetch).not.toHaveBeenCalled();
    });

    it("a GET to an offlineImageHosts host for a URL in the images cache is answered from the cache when the network fails", async () => {
      const { sandbox, dispatch } = loadWorker(SHELL_CONFIG);
      const imageUrl = "https://api.app.test/s3/object?key=art.png&sig=1";
      const cachedImage = new Response("image bytes");
      const imagesCache = makeCache({
        match: vi.fn(async (url: string) => (url === imageUrl ? cachedImage : undefined)),
      });
      sandbox.caches.open.mockImplementation(async (name: string) =>
        name === "test-images" ? imagesCache : makeCache(),
      );
      sandbox.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const event = dispatch("fetch", {
        request: { method: "GET", mode: "no-cors", destination: "image", url: imageUrl },
      });

      expect(event.respondWith).toHaveBeenCalledTimes(1);
      expect(await event.respondWithPromise).toBe(cachedImage);
      expect(sandbox.caches.open).toHaveBeenCalledWith("test-images");

      const online = new Response("fresh bytes");
      sandbox.fetch.mockResolvedValue(online);
      const onlineEvent = dispatch("fetch", {
        request: { method: "GET", mode: "no-cors", destination: "image", url: imageUrl },
      });
      expect(await onlineEvent.respondWithPromise).toBe(online);

      const otherHost = dispatch("fetch", {
        request: { method: "GET", mode: "no-cors", destination: "image", url: "https://cdn.other.test/a.png" },
      });
      expect(otherHost.respondWith).not.toHaveBeenCalled();
    });

    it("an offline image host's image through Next's optimizer (/_next/image) falls back to the downloaded original", async () => {
      const { sandbox, dispatch } = loadWorker(SHELL_CONFIG);
      const imageUrl = "https://api.app.test/s3/object?key=art.png&sig=1";
      const cachedImage = new Response("image bytes");
      const imagesCache = makeCache({
        match: vi.fn(async (url: string) => (url === imageUrl ? cachedImage : undefined)),
      });
      sandbox.caches.open.mockImplementation(async (name: string) =>
        name === "test-images" ? imagesCache : makeCache(),
      );
      sandbox.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
      const optimized = `${ORIGIN}/_next/image?url=${encodeURIComponent(imageUrl)}&w=256&q=75`;

      const event = dispatch("fetch", {
        request: { method: "GET", mode: "no-cors", destination: "image", url: optimized },
      });
      expect(await event.respondWithPromise).toBe(cachedImage);

      const missing = dispatch("fetch", {
        request: {
          method: "GET",
          mode: "no-cors",
          destination: "image",
          url: `${ORIGIN}/_next/image?url=${encodeURIComponent("https://api.app.test/s3/other")}&w=256&q=75`,
        },
      });
      expect(((await missing.respondWithPromise) as Response).type).toBe("error");
    });
  });
});
