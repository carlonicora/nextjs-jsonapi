# Migrating an app to nextjs-jsonapi 4.0.0 and Cache Components

4.0.0 is the release that makes the library work under Next 16.4 Cache Components
(`cacheComponents` + `partialPrefetching`). It carries three breaking changes and a
set of new pieces that exist for one reason: an app frame that is in the static
shell while the session streams in behind it.

This guide is the recipe that was proven on the first app migrated. It is written
for a fresh session that has this repository and the consuming app in front of it.
Where it says "the app", read the app being migrated.

Prerequisites: Next 16.4.0, React 19.3, next-intl with `i18n/request.ts` on
`next/root-params`.

---

## 1. Breaking changes

### 1.1 `configureI18n` requires `getLocale`

```ts
import { configureI18n } from "@carlonicora/nextjs-jsonapi";
import { getLocale } from "next-intl/server";

configureI18n({ useRouter, useTranslations, useLocale, useDateFnsLocale, Link, usePathname, getLocale });
```

The library no longer imports next-intl itself. Reason: `instrumentation.ts` loads
the library, and next-intl's `getLocale` pulls in the app's `i18n/request.ts`, which
reads `next/root-params`, a module Next allows only inside the app directory.

That same reason forces a split of the app's bootstrap. Mirror it exactly:

| File | Holds | Loaded by |
|---|---|---|
| `src/config/instrumentation-env.ts` | everything the old `env.ts` did **except** `configureI18n`: bootstrap, `configureJsonApi`, `configureAuth`, `configureRoles`, `configureLogin`, ... | `src/instrumentation.ts` (`await import("@/config/instrumentation-env")`) |
| `src/config/env.ts` | `import { ENV } from "./instrumentation-env"` re-exported, plus `configureI18n({...getLocale})` | every server component and the client bootstrap, unchanged |
| `src/i18n/navigation.ts` | `createNavigation(routing)` exports: `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` | `env.ts` and components |
| `src/i18n/routing.ts` | `defineRouting(...)` only | `proxy.ts`, `navigation.ts`, `request.ts` |

The proxy must never import `navigation.ts`: `createNavigation` loads the request
config too.

### 1.2 `createNextConfig`: `cspRemove` is gone, `services` replaces it

```js
const { createNextConfig } = require("@carlonicora/nextjs-jsonapi/next-config");

module.exports = withNextIntl(
  createNextConfig({
    devOrigins: ["myapp.test"],
    services: ["stripe", "discord"],        // "stripe" | "googleMaps" | "turnstile" | "discord" | "googleFonts"
    csp: { "frame-src": ["https://docs.google.com/"] },   // extras only, per directive
    mdx: false,
    serwist: true,
    imageMinimumCacheTTL: 60,
    permissionsPolicy: { camera: "none" },
    rewrites: async () => ({ beforeFiles: [] }), // pass-through, verbatim from the old config
    extend: (config) => config,                  // last resort for anything else
  }),
);
```

The base CSP holds only `'self'`, inline/eval, `data:`, `blob:` and the hosts derived
from the app's env (`NEXT_PUBLIC_API_URL`, its websocket form, `NEXT_PUBLIC_ADDRESS`,
`IMAGE_SOURCES`). Every third party comes from `services`; anything outside the five
goes into `csp`. Decide the list with the browser console open: a wrong list shows
up as CSP violations on first load.

The helper sets `cacheComponents: true`, `partialPrefetching: true`,
`experimental.turbopackGc`, `authInterrupts`, the
`yjs` alias, the E2E guards (`E2E_BUILD` → `distDir: .next-e2e`) and the security
headers. Plugin wrapping (`next-intl/plugin`, `@next/mdx`, serwist) stays in the app:
the helper must not require anything that is a devDependency of the app, because
`next.config.js` is loaded at runtime in production.

With the E2E guard, add `.next-e2e/` to the app's `.gitignore` and
`".next-e2e/**"` to its eslint `ignores`.

### 1.3 Providers take a session promise

`SocketProvider`, `ViewportProvider` and `SidebarProvider` accept
`session?: Promise<SessionSnapshot>` from `ServerSession.read()`. The old props
(`token`, `initialIsMobile`, `defaultOpen`) still work, so a half-migrated app builds.
The point of the promise is section 4: the providers never await it, so the layout can
render its children before the session resolves.

Side effect to know about: `CurrentUserProvider` no longer calls `usePathname()`, and
`matchUrlToModule({ path })` now honours its `path` argument. `hasPermissionToPath(url)`
therefore checks the module of the **item**, not of the page the user is on. Sidebar
items may appear or disappear for some users; that is the corrected behaviour. List
the changes for the test user in the hand-back.

---

## 2. New pieces

| Export | From | What it is |
|---|---|---|
| `ServerSession.read(): Promise<SessionSnapshot>` | `/server` | `{ isLogged, isAdministrator, token?, sidebarOpen, isMobile }` from cookies and headers. Call it, never await it, in the shell component. |
| `SessionProvider({ session })`, `useSession()` | `/contexts` | Stores the promise. `useSession()` calls `use()`, so the **caller** suspends and must sit behind its own `<Suspense>`. |
| `useSidebarControls()` | `/components` | `useSidebar()` minus `isMobile`. Use it in anything on the path between the layout and `{children}` (mobile navigation, toggles): `useSidebar().isMobile` suspends on the session. |
| `useIsMobile()` | `/core` | Unwraps a promise-based `ViewportProvider` with `use()`, so the caller suspends until the session settles. The library's own consumers (`Sidebar`, `RoundPageContainer`, tables, breadcrumbs) suspend behind their own boundary; page content lands in the page's `loading.tsx`. App code that calls it needs its own `<Suspense>`, as with `useSession()`. |
| `mapThenable(thenable, fn)` | internal (`src/utils/map-thenable.ts`) | A promise passed from a server to a client component arrives as React's wire chunk: its `then()` returns `undefined`, so `.then().catch()` chains and `Promise.resolve()` do nothing. Every library provider derives from the session through it. App code that derives from the session promise in a client component needs the same `new Promise` adoption. |
| `cachedServerGet(params)` | `/cached-get` | Token-free `"use cache"` GET for shared data (`react-server` condition; a stub for the client and plain node). A module `cache` value that is a `cacheLife` profile name sets the life; any other value is a tag. Errors are not stored and only `error.digest` (`HTTP_<status>`) survives to production; read it with `statusFromDigest`. |
| `createNextConfig`, `CspService` | `/next-config` | Section 1.2. |

---

## 3. Turning Cache Components on

Order of work that keeps the build green at each step:

1. **Config.** Replace `next.config.js` with the helper (1.2). Delete
   `experimental.useCache` and any dead `webpack()` block. Compare the generated
   headers against the old config in a one-off scratch script, then delete the script:
   parity checks run in the consumer and are stored nowhere.
2. **i18n.** The split in 1.1. `i18n/request.ts` resolves the locale from an explicit
   override, then `next/root-params` (inside try/catch: it throws in Server Actions and
   Route Handlers), then `requestLocale`, then the default. Messages are imported
   statically into a literal map, never through a template-literal `import()`.
   `[locale]/layout.tsx` exports `generateStaticParams` returning `routing.locales`
   and drops `setRequestLocale`.
3. **Segment exports.** `dynamic`, `revalidate`, `fetchCache`, `dynamicParams` and
   `runtime = 'edge'` all error under Cache Components, re-exports included. A route
   that re-exports from `createSerwistRoute` keeps only `generateStaticParams` and
   `GET`. Public pages that used `export const revalidate` go through the cached path
   instead: a module with `cache: "<profile or tag>"` already does. A route handler that
   reads `req.url` stays dynamic and must not add its own `"use cache"` around a call
   that reads the locale.
4. **Build.** `pnpm --filter <app> exec next build --debug-prerender`. Fix what it
   reports with the rules below. Never add `export const instant = false` to make it
   pass; a route that truly must block is listed with its reason.

   The build must never call the API: Docker and CI build with no API reachable. A
   static page (no params to wait for) that reads through the cached path is
   prerendered, so the build makes that call, and a cached call that fails fails the
   page's prerender ("Error occurred prerendering page") **even when the caller
   catches the error**: `cachedServerGet` throws so Next does not store the result,
   and Next fails the page on that throw. Move every API read on a static page (a
   help landing, a sitemap route) into a component that awaits `connection()` behind
   its own `<Suspense>`, or call `connection()` first in a route handler. The read is
   still cached at run time. Check by building with the API stopped.

   When a cached page fails with `HTTP_404` at run time, call the API endpoint.
   "Cannot GET" means the route is not mounted, which is a server change (the
   nestjs-neo4jsonapi public help routes are opt-in:
   `bootstrap({ howTo: { publicRoutes: true } })`), not a web one.

### Rules the build and the dev validator enforce

- `cookies()`, `headers()`, `params`, `searchParams` and uncached IO sit inside a
  `<Suspense>` boundary or a cache scope. Plain `"use cache"` cannot read cookies.
- **Nothing on the path from a layout to its `{children}` may await or suspend.** A
  top-level `await` of the session in a layout drops every page below it from the
  shell. Section 4 is the fix.
- A client component in a shared layout that calls `usePathname`, `useParams`,
  `useSelectedLayoutSegment` or `useSearchParams` moves that read into a leaf
  component behind its own `<Suspense fallback={null}>`, and keeps rendering its
  children outside that boundary.
- `Date.now()`, `new Date()` and `Math.random()` during render fail the prerender,
  silently in a client component: the whole frame drops out of the shell. Random
  widths come from `useId`; clock reads move into effects or state.
- `generateMetadata` may read cookies, headers or params only on a page that already
  defers to request time. A static page's metadata helper takes the path as an
  argument instead of reading the `x-full-url` header; a static component that needs
  request-time data (the footer's year) awaits `connection()` inside its own boundary.
  The auth pages (login, logout, register) are static too: pass their path as well.
- A layout rendered with `next/dynamic({ ssr: false })` renders nothing on the server,
  so every page under it is missing from the shell. Import it statically; a layout is
  loaded only on its own routes anyway.
- `"use cache"` works from the library's ESM output only; nothing may resolve the
  server entry through `require`.

---

## 4. The session shell

The frame is in the static shell. The session streams into it. This is the shape;
copy it, then adapt the providers to what the app has.

`app/[locale]/(main)/layout.tsx`:

```tsx
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppFrameSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
```

`features/common/components/session/AppShell.tsx`, a **synchronous** server component:

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  const session = ServerSession.read(); // not awaited

  return (
    <SessionProvider session={session}>
      <ViewportProvider session={session}>
        <SocketProvider session={session}>
          <CurrentUserProvider>
            <PushNotificationProvider>
              <NotificationContextProvider>
                <SidebarProvider session={session}>
                  <RefreshUser />
                  <Suspense fallback={null}><GlobalFolderDropZone /></Suspense>  {/* reads the URL */}
                  <LayoutDetails>{children}</LayoutDetails>
                </SidebarProvider>
              </NotificationContextProvider>
            </PushNotificationProvider>
          </CurrentUserProvider>
        </SocketProvider>
      </ViewportProvider>
    </SessionProvider>
  );
}
```

`LayoutDetails` (client) renders two regions. The sidebar region is
`<Suspense fallback={<SidebarSkeleton />}><AppSidebar /></Suspense>`; `AppSidebar`
calls `useSession()` and streams in, with a one-line guard that `router.replace("/login")`
if `isLogged` is ever false. The content region is `{children}` with no boundary at
this level: each page's `loading.tsx` is its boundary. The header stays page content
(the library's `RoundPageContainer` renders it), so the header bar belongs to the
page skeleton, not to the frame.

Go through every wrapper between the layout and `{children}` and apply the rule:

| Wrapper reads | Do |
|---|---|
| the pathname or search params (page tracker, onboarding route watcher, drop zone) | move the read into a `null`-rendering leaf behind `<Suspense fallback={null}>`; render `{children}` outside it |
| `useSidebar().isMobile` (mobile navigation) | `useSidebarControls()` |
| the user state to **block** (trial expiry) | render `{children}` always; cover only the content column with an absolute overlay while the state is unknown or blocked; redirect from an effect. Not a fixed full-screen overlay: that hides the frame skeleton |
| the session to branch between a logged-out and a logged-in tree | delete the branch. The proxy is the login gate (section 6); no chrome has a logged-out path |

Other groups:

- **Admin.** Same `AppShell`. The administrator check leaves the layout and becomes a
  `requireAdministrator(locale)` call at the top of every admin page component:
  `redirect` to login when not logged in, `notFound()` when not an administrator.
- **A blocked or minimal group** (trial expired): a small shell with `SessionProvider`,
  `SocketProvider` and `CurrentUserProvider` on the promise, behind a centred skeleton.
- **A group whose provider reads the pathname** (persons): the read moves into a child
  behind its own boundary; the provider renders its children unconditionally.
- **Groups without the shell that still read the user** (auth, a public help centre
  whose header or "ask" box calls `useCurrentUserContext`): `CurrentUserProvider`
  leaves the root layout for the shell, so these groups lose it. Each one wraps its
  layout in `<Suspense fallback={<SessionFallback />}><CurrentUserProvider>`. The
  provider reads the pathname, which suspends while `[code]`-style routes prerender,
  hence the boundary.
- **Root-level consumers of the user** (a PWA provider that registers the service
  worker for logged-in users only): the part that reads the user moves into a
  `null`-rendering component inside `AppShell`, and into any other group above that
  needs it. The provider at the root keeps only what does not read the user.

---

## 5. Loading files: one per data-fetching segment

Every route segment whose page awaits data, the session or a permission check owns a
`loading.tsx`. Not the group, not the parent: **the segment itself**, nested ones
included (`rolls/[id]/photographs/[photographId]/loading.tsx` as well as
`rolls/[id]/loading.tsx`). A client navigation re-renders only below the segment the
two routes share, so a boundary in the parent does nothing for a navigation between
siblings, and the dev validator reports "uncached data during a navigation".

A static page (a client-only form, a marketing page) needs none.

Survey script, run from `app/[locale]`, listing every page without a loading file and
whether it awaits anything:

```sh
find . -name page.tsx | sort | while read p; do d=$(dirname "$p"); [ -f "$d/loading.tsx" ] && continue
  f="$p"; grep -q "^export { default" "$p" && f="<resolve the re-exported component path>"
  a=sync; grep -qE "export default async|await " "$f" && a=ASYNC
  printf "%-6s %s\n" "$a" "$d"; done
```

Fallbacks: `PageSkeleton` for app and admin pages; a blank `min-h-screen` div for
auth, shared and portal groups that have no frame. Keep that div in one app component,
`features/common/components/session/SessionFallback.tsx`
(`<div className="bg-background min-h-screen" />`), and use it in those loading files
and in the Suspense fallbacks of section 4.

Replace every existing `loading.tsx` with the standard skeleton, including old ones
that are `async` or start with `"use server"`.

---

## 6. Proxy: the login gate and the public list

`proxy.ts` refreshes the token first, so every decision sees the real session state,
then:

- no session and the path is not public → redirect to `/login?callbackUrl=<path>`
  and clear both cookies;
- no session on `/` → rewrite to `/home`, the static marketing landing, URL unchanged;
- a session → set the refreshed token cookie as before.

The public list is derived from the route groups and written next to the groups it
mirrors: `/` and `/home`; every top-level segment of the marketing group; every
top-level segment of the auth group, **including `/oauth`** (the API sends a refused
social login to `/oauth/error` with no session); shared and portal groups; `/offline`
(the service worker precaches it unauthenticated). Matching is exact for `/` and
`path === p || path.startsWith(p + "/")` for the rest. The old
`startsWith(path)` with `"/"` in the list exempted everything, which is why the
layouts carried logged-out branches.

The marketing landing moves out of the app group into `(marketing)/home/page.tsx`
with static metadata. The marketing header picks its dark variant from the pathname
inside its existing Suspense leaf; no second layout.

`/home` exists because `/` cannot be prerendered: the app group's `/` page reads the
session to show the logged-in home. The rewrite sends logged-out visitors to a page
that reads nothing, so it is served from the static shell, and the URL stays `/`.

Once the proxy is the gate, a group layout that only checked the session is a
pass-through (`return props.children`). Delete it.

Tests that read `proxy.ts` as text and slice it by constant or function names break
when the proxy is rewritten. Update their markers to the new names.

---

## 7. Skeletons

Three app components under `features/common/components/skeletons/`, built from the
library's `Skeleton` and `SidebarMenuSkeleton`:

- `SidebarSkeleton`: logo block and eight menu rows, hidden below `md`.
- `PageSkeleton`: a header bar line, then a title and two content blocks in the
  rounded content card. Uses logical margins (`me-`, not `mr-`).
- `AppFrameSkeleton`: `SidebarSkeleton` + `PageSkeleton` in the frame grid. The
  fallback of the `(main)` and `(admin)` boundaries.

---

## 8. Verification

**Build.** `next build` lists app routes as `◐`. The marketing landing is `◐` too
when its layout has Suspense holes (analytics, referral capture); that is fine. Grep
the prerendered HTML of a list and a detail route for the frame markup and the
skeleton rows; the shell must contain both.

**Dev validator.** Its findings do **not** reach the browser console or a hard
reload. They live in the dev overlay under *Next.js Dev Tools → Navigation
Inspector*. Check every route family there, including nested segments. This script
drives `playwright-cli` through it and prints a verdict per URL:

```sh
#!/bin/zsh
# inspect.sh <url>  — needs a logged-in playwright-cli session
playwright-cli goto "$1" >/dev/null 2>&1; sleep 12
playwright-cli eval "() => { const sr = document.querySelector('nextjs-portal').shadowRoot; Array.from(sr.querySelectorAll('button')).find(x => (x.getAttribute('aria-label')||'').includes('Dev Tools')).click(); return 1; }" >/dev/null 2>&1; sleep 1
playwright-cli eval "() => { const sr = document.querySelector('nextjs-portal').shadowRoot; Array.from(sr.querySelectorAll('*')).find(x => x.children.length === 0 && x.textContent.trim() === 'Navigation Inspector').click(); return 1; }" >/dev/null 2>&1; sleep 3
out=$(playwright-cli eval "() => Array.from(document.querySelector('nextjs-portal').shadowRoot.querySelectorAll('*')).filter(e => !['STYLE','SCRIPT','svg','path'].includes(e.tagName) && e.children.length === 0 && e.textContent.trim()).map(e => e.textContent.trim()).filter((t,i,a) => a.indexOf(t) === i).join(' | ').slice(0, 300)" 2>&1 | sed -n '/### Result/{n;p;}')
case "$out" in *encountered*|*Blocking*|*"1/"*) echo "INSIGHT  $1"; echo "         $out";; *) echo "clean    $1";; esac
playwright-cli press Escape >/dev/null 2>&1
```

`playwright-cli eval` takes a plain expression, or a full `() => ...` function when
the code contains arrows. The inspector also surfaces runtime and console errors for
the route, which is how pre-existing crashes show up during this work; fix or report
them separately.

A 404 page reads as clean. Use ids the logged-in user can actually open (a player
cannot see an item the GM has not shared), and check the page title next to each
verdict.

**Browser, logged in:** cold load shows the frame skeleton, then the sidebar, then
the page; phone width is mobile from the first paint; a page the user cannot read
renders `unauthorized`; an editor save shows fresh data; back out of an editor sheet
leaves it closed.

**Browser, logged out:** `/` shows the landing with its dark header; an app URL goes
to login with `callbackUrl`; one route per public group loads; a stale token with a
dead refresh token lands on login with both cookies cleared.

**Production:** `next build && next start` with `--prod` dependencies, `/` served
from the prerender (`x-nextjs-prerender: 1`), an app route sends its shell first and
streams the rest.

Run the browser part of this check on an `E2E_BUILD=true` build. A plain production
build sends `upgrade-insecure-requests` and HSTS, so on a local `http://` host the
browser rewrites every request to `https://` and the app does not load. The E2E build
also writes to `.next-e2e`, so it does not overwrite the `.next` a running dev server
uses. Check the real production headers with `curl -sI` against a plain build.

If the app pins the library version anywhere besides the submodule (a production
versions file that a lint-time drift check compares), bump that pin to 4.x too.

---

## 9. Things the first migration hit that no rule above names

- The validator stayed silent in a scratch app and only reported inside the real app,
  after about ten seconds. Do not conclude from a scratch app that a route is clean.
- A hard reload of a route can pass while a client navigation into it fails. Test the
  navigation.
- Promise-based providers crashed or silently fell back until `mapThenable` existed,
  because the wire thenable's `then()` returns nothing. Any new code that derives from
  the session promise in a client component goes through it.
- A fixed full-screen overlay anywhere in the frame hides every skeleton. Scope
  overlays to the column they protect.
- Two failing cached calls in one render never close the response. A page that makes
  two cached reads runs them in sequence and skips the second when the first fails.
- An `unauthorized()` inside a streamed boundary returns 200. Accepted.
- The marketing header's empty placeholder kept the row's height but not its width.
  In a `justify-between` header the centred nav jumped when the buttons arrived (75 px
  logged out, 28 px logged in). Give the buttons and the placeholder one slot with a
  fixed `min-width` as wide as the widest button set, aligned to the end.
- A hand-built `/${locale}/...` link breaks client navigation when
  `localePrefix` is `"as-needed"`: the proxy redirects `/en/x` to `/x`, and the
  client cannot read the page data across the redirect ("Cannot write to a CLOSED
  writable stream" in the console). Link without the default locale, or through
  `generateUrl` / the navigation `Link`. Canonical URLs and sitemaps drop it too.
- A route handler renders no layout, so nothing loads `env.ts` for it. One that reads
  through a module (a help sitemap calling the cached how-to GET) throws "Class not
  registered for key" until it imports `@/config/env` itself.
