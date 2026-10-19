# Migrating an app to nextjs-jsonapi 5.0.0 and the standard service worker

5.0.0 removes Serwist from the fleet. The worker is a plain file the library
ships and every app copies; nothing bundles it at build time or at request time.
The release carries two breaking changes and three new pieces.

The full design, the per-app removal lists and the guards are in the wyrdli
repository: `docs/superpowers/specs/2026-10-19-standard-service-worker-design.md`.
This file is the library-side summary a consuming app needs.

---

## 1. Breaking changes

### 1.1 `createNextConfig` no longer takes `serwist`

The option existed only to add `serverExternalPackages: ["esbuild", "esbuild-wasm"]`
for the Serwist route handler. That route is gone from every app, so the option is
gone from `NjaNextConfigOptions`. An app that still passes `serwist: true` gets a
type error in TypeScript and a silently ignored key in `next.config.js`; remove it.

### 1.2 `usePushNotifications` takes the user as input

```ts
// 4.x: read the library's user context itself
usePushNotifications();

// 5.0: the caller passes what the hook needs
usePushNotifications({ currentUser, canSubscribe });
// currentUser: UserInterface | undefined
// canSubscribe: boolean, false for administrators where that rule applies
```

The hook no longer reads any context, so an app with its own user context (a360ai)
can call it. It is exported by name from `@carlonicora/nextjs-jsonapi/client`.

`PushNotificationProvider` (from `/components`) keeps its no-props signature: it reads
the library's `useCurrentUserContext()`, computes `canSubscribe` as "not an
Administrator", and calls the hook. Apps that mount it in `AppShell` or a help layout
change nothing. An app that does not mount the library's `CurrentUserProvider` writes
its own six-line client provider that reads its context and calls the hook.

The hook now also:

- registers `"/sw.js"` with `{ updateViaCache: "none" }` in every environment, never a
  dev worker and never an absolute URL;
- listens for the worker's `PUSH_RESUBSCRIBED` message and re-registers a rotated
  subscription once per tab (session-hash guard; only when a user can subscribe).

## 2. New pieces

### 2.1 `pwa/sw.js`

The canonical worker. Every app copies it verbatim to `apps/web/public/sw.js` and
keeps a unit spec that compares the bytes against
`require.resolve("@carlonicora/nextjs-jsonapi/pwa/sw.js")`. The worker:

- loads `/sw-config.js` first (`importScripts`), which sets
  `self.NJA_SW_CONFIG = { appId, offlineRevision, notificationIcon }`;
- caches exactly one response, `/offline.html`, in `${appId}-offline-${offlineRevision}`;
- intercepts navigations only: preload response, else network; on a thrown fetch the
  cached offline page, else a minimal inline one; 4xx/5xx and redirects pass through;
- never calls `skipWaiting()` on install; activates on `{ type: "SKIP_WAITING" }`;
- deletes every other cache on activate (Serwist's, any older app cache), enables
  navigation preload, claims clients;
- handles push, notification click and subscription rotation; after a rotation it
  posts `PUSH_RESUBSCRIBED` to one window client.

### 2.2 `pwa/offline.template.html`

A self-contained offline page: inline CSS and SVG, no `/_next/` reference, no web
font. Placeholders: `{{APP_NAME}}`, `/*{{THEME_CSS}}*/` (one `:root` block and one
`.<theme>` block per theme, six tokens each, copied from the app's `globals.css`),
`{{TITLE}}`, `{{DESCRIPTION}}`, `{{RETRY}}` (default-locale strings), and
`{{OFFLINE_CONFIG}}`, a JSON object:

```json
{ "defaultTheme": "light", "enableSystem": true, "themes": ["dark"],
  "defaultLocale": "en", "locales": ["en", "it"], "rtl": [],
  "strings": { "en": { "title": "…", "description": "…", "retry": "…" } } }
```

The inline script mirrors next-themes (`localStorage.theme`, else the default,
`"system"` follows the OS only when `enableSystem`) and picks the locale from the URL
prefix, then the `NEXT_LOCALE` cookie, then `navigator.languages`, then the default.
It sets `lang`, `dir` (`rtl` for the listed locales) and the three strings.

Each app fills the template by hand into `apps/web/public/offline.html` and sets
`offlineRevision` to the first 8 hex chars of its sha256; the app's spec checks both.

### 2.3 `exports["./pwa/*"]`

`pwa/` is in `files` and exposed as `./pwa/*`, so an app can resolve the canonical
files from the installed package, from the workspace submodule and from npm alike.

## 3. Order of work in an app

1. Move the submodule to the `v5.x` tag and `versions.production.json` to the same
   version (production images install from npm by that file).
2. Copy `pwa/sw.js` to `public/sw.js`; write `public/sw-config.js`; fill
   `public/offline.html`; compute `offlineRevision`.
3. Delete the Serwist route, `src/app/sw.ts`, `public/sw-dev.js`, the dev teardown,
   the `/offline` page, the `/sw.js` rewrites, the `serwist` option and the
   `serwist` / `@serwist/*` / `esbuild` dev dependencies.
4. Register `"/sw.js"` with `{ updateViaCache: "none" }` everywhere, with no
   environment gate; reload on `controllerchange` before posting `SKIP_WAITING`.
5. Add the file guard spec and a `chromium-pwa` Playwright project on `localhost`
   with a non-administrator login.

Release note for users: "If pages are slow or missing after the update, close the
app completely once and reopen it." A browser on the old worker installs the new one
beside it and switches on the prompt, or when the last window closes.
