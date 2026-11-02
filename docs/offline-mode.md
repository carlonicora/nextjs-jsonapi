# Offline mode

Offline mode keeps a working copy of a user's records on the device, answers the
app's requests from it when the network is gone, and sends the waiting changes
back in one request on reconnect. It is opt-in: an app that does not call
`configureOffline(...)` and does not set `offlineShell` in `sw-config.js` behaves
exactly as before.

An app opts in in five places.

## 1. The device copy and the request layer

Call `configureOffline(config)` from `@carlonicora/nextjs-jsonapi/offline` once on
the client, with:

- `getUserId`: the signed-in user's id. One database per user
  (`nja-offline-<userId>.sqlite3`); only that user's file is ever opened.
- `rootModule`: the module whose records own every other record.
- `types`: one `OfflineTypeConfig` per record type the device keeps (how it is
  fetched, whether it is read-only offline, its server-owned fields).
- `routes`: the local answers for the app's custom endpoints. Generic
  `GET`/`POST`/`PATCH`/`PUT`/`DELETE` on a configured type are answered by the
  library; any other request answers 503 `needs-connection` offline.
- `listSyncRoots`: the ids of the root records to keep on the device.
- `shellPath(locale)`: the offline shell URL of a locale (section 3).
- `syncIntervalMs`: how often the background sync runs while online.
- `deviceWorkerUrl` / `sqliteModuleUrl` (optional): where the device worker and
  SQLite are loaded from (defaults `/offline-sqlite/device-worker.mjs` and
  `/offline-sqlite/index.mjs`; section 5).
- `requireOptIn` (optional): offline mode stays off on each device until the user
  turns it on (see "Turning offline mode on per device" below). Without it,
  offline mode is always on, as before.

Mount `startOfflineRuntime()` once in the signed-in layout (it returns its
cleanup). It listens to online/offline, runs the sync on its interval and, on
reconnect, sends the waiting changes and then syncs.

### Turning offline mode on per device

With `requireOptIn: true`, nothing offline runs for a user on a device until they
turn it on there. The switch is stored per user per device in `localStorage`
(`nja-offline-enabled:<userId>`); until it is on, `isOfflineConfigured()` answers
false and `getOfflineStore()` refuses.

- `turnOnOffline()` stores the switch, sets `enabled: true` in the offline state
  and asks the browser to keep the storage (`navigator.storage.persist`). It does
  not start the runtime: mount `startOfflineRuntime()` once `enabled` is true.
- `turnOffOffline()` answers `{ turnedOff: false, pending }` and changes nothing
  while the device copy has changes to send. Otherwise it stops the runtime,
  deletes this device's database and images cache, clears the switch and answers
  `{ turnedOff: true }`.
- `refreshOfflineDeviceState()` reads the switch and the last sync time back into
  the state (`configureOffline` and `startOfflineRuntime` call it).

The offline state also carries `enabled`, `syncProgress` (`{ done, total }`
root records while a full sync runs, else null), `lastSyncedAt` (epoch ms of the last
full sync, stored as `nja-offline-last-sync:<userId>`) and `rootCount` (how
many root records that sync kept).

## 2. The service worker

The app's `public/sw.js` stays a byte-for-byte copy of `pwa/sw.js`. Two optional
keys in `public/sw-config.js` turn the offline branches on:

```js
self.NJA_SW_CONFIG = {
  appId: "myapp",
  offlineRevision: "<sha256 of offline.html, 8 chars>",
  notificationIcon: "/icons/icon-192.png",
  // Offline shell: one cached page per locale; `default` serves every other path.
  offlineShell: { default: "/offline-shell", locales: { it: "/it/offline-shell" } },
  // Hosts (or origins) whose GETs fall back to the images cache offline.
  offlineImageHosts: ["api.myapp.com"],
};
```

With `offlineShell` set, the worker:

- at install reads `/offline-manifest.json` (`{ buildId, assets }`) and caches every
  asset plus each shell URL in `<appId>-shell-<buildId>`. One failed file fails the
  install, so the previous worker stays in charge until a complete set is cached;
- at activate deletes the shell caches of other builds and keeps `<appId>-images`
  and the offline page cache;
- answers a failed navigation with the shell of its locale (the first path segment
  matched against `locales`, otherwise `default`), then `offline.html`, then the
  inline fallback;
- after an online navigation (at most every few minutes) re-reads the manifest and, when
  the server runs a build it has no complete shell cache for, precaches that build's
  shell in the background and drops the other shell caches. A deploy therefore
  refreshes the offline shell without a new worker (sw.js does not change between
  builds), and the app registers the worker under the same `/sw.js` URL as always;
- serves GETs under `/_next/static/` cache-first from the shell cache;
- sends every other same-origin GET to the network first and, when the network
  fails, answers it from the shell cache (the device worker and SQLite files).

With `offlineImageHosts` set, a GET to one of those hosts goes to the network and,
when the network fails, is answered from `<appId>-images`, where the sync stores
each artwork image under the exact URL its record holds.

The `locales` paths are cache keys matched against the failed navigation's first
path segment, never links.

## 3. The manifest route and the shell page

Answer `/offline-manifest.json` at run time with `buildOfflineManifest` from
`@carlonicora/nextjs-jsonapi/server`. Pass the `distDir` your `next.config` uses, so
every running server describes its own build:

```ts
// app/offline-manifest.json/route.ts (outside [locale])
import "@/config/env";
import { buildOfflineManifest } from "@carlonicora/nextjs-jsonapi/server";
import { connection } from "next/server";

export async function GET() {
  await connection();
  return Response.json(await buildOfflineManifest({ distDir: process.env.E2E_DIST_DIR ?? ".next" }));
}
```

It returns the content of `<distDir>/BUILD_ID` and every file under
`<distDir>/static` as `/_next/static/...`, plus any `extraAssets` you pass. Pass the
device worker and SQLite files (section 5), so the shell can open the device copy
with no network:

```ts
extraAssets: OFFLINE_SQLITE_FILES.map((file) => `/offline-sqlite/${file}`),
```

The shell page (`shellPath(locale)`) is a public, client-only route outside the
signed-in layout. It reads `window.location.pathname`, matches it against the app's
route table and renders the same Provider and screen the server page renders, from
the device copy. A path with no entry shows the app's "You are offline" page.

## 4. Logout

`<Logout>` takes an optional `beforeLogout?: () => Promise<boolean>`, awaited before
anything is cleared. Returning `false` cancels the logout.

```tsx
<Logout
  beforeLogout={async () => {
    const { pending } = await prepareOfflineLogout();
    if (pending > 0 && !(await askSendOrDiscard())) return false;
    if (userId) await finishOfflineLogout(userId);
    return true;
  }}
/>
```

- `prepareOfflineLogout()` answers `{ pending }`: every entry still in the signed-in
  user's queue (pending, sending, in conflict or failed). 0 when offline mode is not
  configured or nobody is signed in.
- `finishOfflineLogout(userId)` deletes that user's device database and the
  `<appId>-images` cache. Nothing the user has not chosen to discard may be waiting
  when it runs. It also turns the `requireOptIn` switch off and clears the last sync
  time: after a logout nothing is downloaded until the user turns offline mode back on.

## 5. The device worker and SQLite files

The device copy runs in a Web Worker on the official SQLite WebAssembly build.
Neither is handed to the app's bundler:

- SQLite's own helper worker is created from a computed URL that Turbopack refuses
  to build.
- Turbopack starts a bundled worker through a launcher that reads its settings from
  a `#params=` URL fragment. A service-worker cache answer drops that fragment, so
  the worker could not start offline.

The package therefore ships both, ready to serve, in `dist/offline/sqlite/`
(`OFFLINE_SQLITE_FILES`): `device-worker.mjs` (one standalone module) and the
SQLite files at the version this package pins. The app serves that folder at
`/offline-sqlite/`, for example by copying it into `public/offline-sqlite/` before
every `dev` and `build` run (git-ignored), and lists the files as `extraAssets` of
the manifest (section 3). The worker opens the user's file on the `opfs` VFS when
the page is cross-origin isolated, otherwise on `opfs-sahpool`.

Browsers expose the private file storage (OPFS) only in a secure context: https, or
`localhost` (a custom dev host such as `http://app.test` is not one), and some
private windows and older browsers lack it or the sync-access handles the worker
needs. In such a browser offline mode switches off for the page: the first use
(normally `onUserSignedIn`, before the runtime starts) finds no secure context, no
`navigator.storage.getDirectory`, a storage `SecurityError`, or the worker answering
"Missing required OPFS APIs", logs one console warning and sets `available: false`
in the offline state. From then on `isOfflineConfigured()` answers false, so the
app runs exactly as online-only: no worker, sync, drain, write-through or lock check
runs, and the status UI can show that offline mode is not available. Any other open
failure (the file held by another tab) keeps the `DeviceStoreUnavailableError`
handling.
