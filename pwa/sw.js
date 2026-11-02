// Standard service worker for every nja app.
//
// This file is copied verbatim into every app's public/sw.js. Each app's guard
// spec compares the bytes of public/sw.js against this file, so never edit an
// app's copy: change this file, release the library, and copy it again.
//
// Per-app values (appId, offlineRevision, notificationIcon) come from the app's
// own public/sw-config.js, which sets self.NJA_SW_CONFIG.
//
// Offline mode (opt-in; without these keys the worker behaves exactly as before):
// - offlineShell: { default: "/offline-shell", locales: { it: "/it/offline-shell" } }
//   At install the worker reads /offline-manifest.json ({ buildId, assets }) and
//   caches every asset plus each shell URL in `${appId}-shell-${buildId}`, then
//   a completion marker last; one failed file fails the install and deletes the
//   half-filled cache, so the previous worker stays in charge and no worker ever
//   answers from a cache without the marker. A
//   failed navigation answers the shell of its locale (the first path segment
//   matched against `locales`, otherwise `default`), then offline.html. GETs
//   under /_next/static/ are served cache-first from the shell cache; after an
//   online navigation the worker re-reads the manifest (at most every few
//   minutes) and precaches a new build's shell in the background, so a deploy
//   refreshes the shell without a new worker; any other
//   same-origin GET goes to the network first and, when it fails, is answered
//   from the shell cache (the device worker and SQLite files). Activate deletes
//   shell caches of other builds.
// - offlineImageHosts: ["api.example.com"] (a host or an origin)
//   A GET to one of these hosts goes to the network; when the network fails it
//   is answered from `${appId}-images`, where the app stores each artwork image
//   under its exact URL. That cache is kept across activations.

importScripts("/sw-config.js");

const OFFLINE_URL = "/offline.html";
const CACHE_NAME = `${self.NJA_SW_CONFIG.appId}-offline-${self.NJA_SW_CONFIG.offlineRevision}`;

const OFFLINE_SHELL = self.NJA_SW_CONFIG.offlineShell || null;
const OFFLINE_IMAGE_HOSTS = self.NJA_SW_CONFIG.offlineImageHosts || [];
const MANIFEST_URL = "/offline-manifest.json";
const SHELL_CACHE_PREFIX = `${self.NJA_SW_CONFIG.appId}-shell-`;
const IMAGES_CACHE_NAME = `${self.NJA_SW_CONFIG.appId}-images`;
// Written last into a shell cache: a shell cache without it is incomplete and never used.
const SHELL_COMPLETE_URL = "/__nja-offline-shell-complete__";

// The shell cache this worker installed. A worker can be stopped and restarted
// between events, losing this value; it then falls back to the newest complete
// shell cache (caches.keys() lists caches in creation order).
let shellCacheName = null;

async function currentShellCacheName() {
  if (shellCacheName) return shellCacheName;
  const keys = await caches.keys();
  const shells = keys.filter(function (key) {
    return key.startsWith(SHELL_CACHE_PREFIX);
  });
  for (let index = shells.length - 1; index >= 0; index--) {
    const cache = await caches.open(shells[index]);
    if (await cache.match(SHELL_COMPLETE_URL)) return shells[index];
  }
  return null;
}

function shellUrls() {
  const urls = [OFFLINE_SHELL.default];
  const locales = OFFLINE_SHELL.locales || {};
  for (const locale of Object.keys(locales)) urls.push(locales[locale]);
  return urls;
}

function shellUrlFor(url) {
  const segment = new URL(url).pathname.split("/")[1] || "";
  const locales = OFFLINE_SHELL.locales || {};
  return Object.prototype.hasOwnProperty.call(locales, segment) ? locales[segment] : OFFLINE_SHELL.default;
}

async function installShell() {
  const response = await fetch(new Request(MANIFEST_URL, { cache: "no-store" }));
  if (!response.ok) throw new Error(`${MANIFEST_URL} answered ${response.status}`);
  const manifest = await response.json();
  const name = `${SHELL_CACHE_PREFIX}${manifest.buildId}`;
  try {
    const cache = await caches.open(name);
    // cache.addAll rejects when any file fails, so the install fails with it.
    await cache.addAll(
      manifest.assets.concat(shellUrls()).map(function (url) {
        return new Request(url, { cache: "reload" });
      }),
    );
    await cache.put(SHELL_COMPLETE_URL, new Response("", { status: 200 }));
  } catch (error) {
    // Never leave a half-filled shell cache behind for any worker to pick.
    await caches.delete(name);
    throw error;
  }
  shellCacheName = name;
}

// A deploy changes the app's build, not this file: sw.js is byte-identical across builds, so no
// new worker is installed. After an online navigation the worker reads the manifest and, when
// the server runs a build it has no complete shell cache for, precaches that build's shell in
// the background, then drops the other shell caches. At most one check per few minutes.
const SHELL_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
let lastShellRefresh = 0;
let shellRefresh = null;

async function refreshShellIfStale() {
  const response = await fetch(new Request(MANIFEST_URL, { cache: "no-store" }));
  if (!response.ok) return;
  const manifest = await response.json();
  const name = `${SHELL_CACHE_PREFIX}${manifest.buildId}`;
  const keys = await caches.keys();
  if (keys.indexOf(name) !== -1) {
    const existing = await caches.open(name);
    if (await existing.match(SHELL_COMPLETE_URL)) {
      shellCacheName = name;
      return;
    }
  }
  await installShell();
  const others = (await caches.keys()).filter(function (key) {
    return key.startsWith(SHELL_CACHE_PREFIX) && key !== shellCacheName;
  });
  await Promise.all(
    others.map(function (key) {
      return caches.delete(key);
    }),
  );
}

function maybeRefreshShell() {
  const now = Date.now();
  if (shellRefresh || now - lastShellRefresh < SHELL_REFRESH_INTERVAL_MS) return shellRefresh || Promise.resolve();
  lastShellRefresh = now;
  shellRefresh = refreshShellIfStale()
    .catch(function (error) {
      // The current shell stays in charge; the next navigation tries again later.
      console.warn("[sw] refreshing the offline shell failed", error);
    })
    .finally(function () {
      shellRefresh = null;
    });
  return shellRefresh;
}

function isImageHost(url) {
  if (!OFFLINE_IMAGE_HOSTS.length) return false;
  const parsed = new URL(url);
  return OFFLINE_IMAGE_HOSTS.indexOf(parsed.host) !== -1 || OFFLINE_IMAGE_HOSTS.indexOf(parsed.origin) !== -1;
}

// Served when a navigation fails and the cached offline page is missing too
// (evicted or cleared). Never answer a navigation with a bare network error.
const OFFLINE_FALLBACK_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>You are offline</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        background: #ffffff;
        color: #111111;
        text-align: center;
        padding: 16px;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background: #111111;
          color: #f5f5f5;
        }
      }
      button {
        margin-top: 16px;
        padding: 8px 16px;
        font: inherit;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>You are offline</h1>
      <p>Check your connection and try again.</p>
      <button type="button" onclick="location.reload()">Retry</button>
    </main>
  </body>
</html>`;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        // cache.add rejects on a network error or a non-2xx response, so the
        // install fails and the previous worker stays in charge.
        return cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      })
      .then(function () {
        if (OFFLINE_SHELL) return installShell();
      }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      const keys = await caches.keys();
      const keep = [CACHE_NAME];
      if (OFFLINE_SHELL) {
        const shell = await currentShellCacheName();
        if (shell) keep.push(shell);
      }
      if (OFFLINE_SHELL || OFFLINE_IMAGE_HOSTS.length) keep.push(IMAGES_CACHE_NAME);
      await Promise.all(
        keys
          .filter(function (key) {
            return keep.indexOf(key) === -1;
          })
          .map(function (key) {
            return caches.delete(key);
          }),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", function (event) {
  // Only navigations are intercepted, plus (offline mode only) build assets and
  // artwork images. Everything else goes straight to the network without
  // respondWith.
  if (event.request.mode !== "navigate") {
    if (!OFFLINE_SHELL && !OFFLINE_IMAGE_HOSTS.length) return;
    const method = event.request.method || "GET";
    if (method !== "GET") return;
    // A no-store request (the page's session refresh of the shell) is never answered from a
    // cache: when the network fails it must fail, so the page knows the app is unreachable.
    if (event.request.cache === "no-store") return;
    const url = new URL(event.request.url);

    if (OFFLINE_SHELL && url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
      event.respondWith(
        (async function () {
          const name = await currentShellCacheName();
          if (name) {
            const cache = await caches.open(name);
            const cached = await cache.match(event.request.url);
            if (cached) return cached;
          }
          try {
            return await fetch(event.request);
          } catch {
            // Offline and not in the shell: a plain network error for the page, no uncaught rejection here.
            return Response.error();
          }
        })(),
      );
      return;
    }

    // An image of an offline image host through Next's image optimizer (`/_next/image?url=...`):
    // network first, then the downloaded original (the images cache keeps it under its own URL).
    const optimizedSource = url.origin === self.location.origin && url.pathname === "/_next/image" ? url.searchParams.get("url") : null;
    if (optimizedSource && /^https?:/.test(optimizedSource) && isImageHost(optimizedSource)) {
      event.respondWith(
        (async function () {
          try {
            return await fetch(event.request);
          } catch {
            const cache = await caches.open(IMAGES_CACHE_NAME);
            const cached = await cache.match(optimizedSource);
            if (cached) return cached;
            return Response.error();
          }
        })(),
      );
      return;
    }

    // Any other same-origin file the offline manifest precached (the device worker and the
    // SQLite files it loads): network first, the shell cache when the network fails.
    if (OFFLINE_SHELL && url.origin === self.location.origin) {
      event.respondWith(
        (async function () {
          try {
            return await fetch(event.request);
          } catch {
            const name = await currentShellCacheName();
            if (name) {
              const cache = await caches.open(name);
              const cached = await cache.match(event.request.url);
              if (cached) return cached;
            }
            return Response.error();
          }
        })(),
      );
      return;
    }

    if (isImageHost(event.request.url)) {
      event.respondWith(
        (async function () {
          try {
            return await fetch(event.request);
          } catch {
            const cache = await caches.open(IMAGES_CACHE_NAME);
            const cached = await cache.match(event.request.url);
            if (cached) return cached;
            return Response.error();
          }
        })(),
      );
    }
    return;
  }

  let reachedNetwork = false;
  const answer = (async function () {
    try {
      const preload = await event.preloadResponse;
      if (preload) {
        reachedNetwork = true;
        return preload;
      }
      // A 4xx/5xx or an opaque redirect is passed through as is.
      const response = await fetch(event.request);
      reachedNetwork = true;
      return response;
    } catch (error) {
      if (OFFLINE_SHELL) {
        const name = await currentShellCacheName();
        if (name) {
          const shellCache = await caches.open(name);
          const shell = await shellCache.match(shellUrlFor(event.request.url));
          if (shell) return shell;
        }
      }
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(OFFLINE_URL);
      if (cached) return cached;
      return new Response(OFFLINE_FALLBACK_HTML, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  })();
  event.respondWith(answer);
  if (OFFLINE_SHELL) {
    event.waitUntil(
      answer.then(function () {
        if (reachedNetwork) return maybeRefreshShell();
      }),
    );
  }
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Notification";
  const options = {
    body: data.message || "You have a new notification",
    icon: self.NJA_SW_CONFIG.notificationIcon,
    data: data.url,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    (async function () {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const windowClient of clientList) {
        if (windowClient.url === event.notification.data && "focus" in windowClient) {
          return windowClient.focus();
        }
      }
      if (self.clients.openWindow && event.notification.data) {
        return self.clients.openWindow(event.notification.data);
      }
    })(),
  );
});

// FCM rotates/expires subscriptions periodically. When it does, re-subscribe
// with the old application server key and hand the new subscription to ONE open
// client (a visible one if there is one), which re-registers it against the API
// with the user's auth. If no client is open, the next page load's
// usePushNotifications re-registers.
self.addEventListener("pushsubscriptionchange", function (event) {
  event.waitUntil(
    (async function () {
      const applicationServerKey = event.oldSubscription && event.oldSubscription.options.applicationServerKey;
      if (!applicationServerKey) return;

      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const plainSubscription = { endpoint: subscription.endpoint, keys: subscription.toJSON().keys };
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const target =
        clientList.find(function (windowClient) {
          return windowClient.visibilityState === "visible";
        }) || clientList[0];
      if (target) {
        target.postMessage({ type: "PUSH_RESUBSCRIBED", subscription: plainSubscription });
      }
    })(),
  );
});
