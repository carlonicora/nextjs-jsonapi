// Standard service worker for every nja app.
//
// This file is copied verbatim into every app's public/sw.js. Each app's guard
// spec compares the bytes of public/sw.js against this file, so never edit an
// app's copy: change this file, release the library, and copy it again.
//
// Per-app values (appId, offlineRevision, notificationIcon) come from the app's
// own public/sw-config.js, which sets self.NJA_SW_CONFIG.

importScripts("/sw-config.js");

const OFFLINE_URL = "/offline.html";
const CACHE_NAME = `${self.NJA_SW_CONFIG.appId}-offline-${self.NJA_SW_CONFIG.offlineRevision}`;

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
    caches.open(CACHE_NAME).then(function (cache) {
      // cache.add rejects on a network error or a non-2xx response, so the
      // install fails and the previous worker stays in charge.
      return cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
    }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
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
  // Only navigations are intercepted. Everything else goes straight to the
  // network without respondWith.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    (async function () {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        // A 4xx/5xx or an opaque redirect is passed through as is.
        return await fetch(event.request);
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(OFFLINE_URL);
        if (cached) return cached;
        return new Response(OFFLINE_FALLBACK_HTML, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    })(),
  );
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
