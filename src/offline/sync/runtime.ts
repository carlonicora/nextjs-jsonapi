import { getCookie } from "cookies-next";
import { getClientToken } from "../../client/token";
import { directFetch } from "../../client/request";
import { EndpointCreator } from "../../core/endpoint/EndpointCreator";
import { buildUrl } from "../../unified/JsonApiRequest";
import {
  getOfflineConfig,
  getOfflineStore,
  isOfflineConfigured,
  OfflineUnavailableError,
  refreshOfflineDeviceState,
} from "../config";
import { getOfflineState, isReconnecting, setOfflineState, setReconnecting, subscribeOfflineState } from "../state";
import { OFFLINE_REPLAY_HEADER } from "../types";
import { refreshOfflineCounts } from "./counts";
import { drainQueue } from "./drain-queue";
import { knownPrimaryRootIds, refreshLockedRoots } from "./known-roots";
import { ROOT_SYNC_ENDPOINT } from "./models/RootSync";
import { currentLocale } from "./session-refresh";
import { syncAll } from "./sync-root";

/** How often the stored lock dates are checked again (a lock date can pass while offline). */
const LOCK_CHECK_INTERVAL_MS = 60_000;
/** How often the API is probed while the session is offline but the browser says it is online. */
const PROBE_INTERVAL_MS = 30_000;

/**
 * Asks the API whether it can be reached again. The request carries the replay header, so
 * `directFetch` sends it to the network instead of answering it from the device copy. Any
 * answer (even a 401) means the API is reachable; only a network error means it is not.
 */
async function probeApi(): Promise<boolean> {
  const config = getOfflineConfig();
  const store = await getOfflineStore();
  // A root record of the primary kind only (the extra kinds' roots answer elsewhere).
  const [rootId] = await knownPrimaryRootIds(store);
  const endpoint = rootId
    ? new EndpointCreator({ endpoint: config.rootModule, id: rootId, childEndpoint: ROOT_SYNC_ENDPOINT })
    : new EndpointCreator({ endpoint: config.rootModule }).addAdditionalParam("page[size]", "1");

  const response = await directFetch({
    method: "GET",
    url: buildUrl(endpoint.generate()),
    token: await getClientToken(),
    language: currentLocale(),
    additionalHeaders: { [OFFLINE_REPLAY_HEADER]: "1" },
  });
  return !response.networkError;
}

/** Remembers (for the tab) the sign-in a reload for the login was already tried for. */
const LOGIN_RELOAD_KEY = "nja-offline-login-reload";
let _reloadedForSignIn: string | undefined;

/** A short fingerprint of the sign-in (the `token` cookie), never the token itself. */
async function signInFingerprint(): Promise<string> {
  const token = await getCookie("token");
  if (!token) return "none";
  let hash = 5381;
  for (const char of String(token)) hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0;
  return hash.toString(36);
}

const readReloadMarker = (): string | null => {
  try {
    return window.sessionStorage.getItem(LOGIN_RELOAD_KEY);
  } catch {
    return null;
  }
};

const writeReloadMarker = (value: string | null): void => {
  try {
    if (value === null) window.sessionStorage.removeItem(LOGIN_RELOAD_KEY);
    else window.sessionStorage.setItem(LOGIN_RELOAD_KEY, value);
  } catch {
    // Storage unavailable: the module flag still stops a loop within this page.
  }
};

/**
 * The sign-in expired: reloading sends the GM through the proxy to the login page. The queue
 * stays. Tried once per sign-in: when the API still refuses the same sign-in after the reload
 * (a 401 while the cookie exists), the GM stays on the page and the queue waits for a new
 * sign-in, instead of reloading in a loop.
 */
async function signInExpired(): Promise<void> {
  const signIn = await signInFingerprint();
  if (_reloadedForSignIn === signIn || readReloadMarker() === signIn) {
    console.warn("[offline] the sign-in expired; log in again to send the waiting changes");
    return;
  }
  _reloadedForSignIn = signIn;
  writeReloadMarker(signIn);
  try {
    window.location.reload();
  } catch (error) {
    console.warn("[offline] the sign-in expired; log in again to send the waiting changes", error);
  }
}

/**
 * Logs a failure of the runtime, except the browser being found unable to keep the device copy:
 * that is warned once (`markOfflineUnavailable`) and the runtime stops.
 */
const warnUnlessUnavailable =
  (message: string) =>
  (error: unknown): void => {
    if (!(error instanceof OfflineUnavailableError)) console.warn(message, error);
  };

const _runningRuntimes = new Set<() => void>();

/** Stops every running offline runtime (timers, listeners). Called on logout. */
export function stopOfflineRuntime(): void {
  for (const stop of [..._runningRuntimes]) stop();
}

/**
 * Starts the offline runtime: drain-then-sync on open (online) and on every reconnect, syncAll
 * every `syncIntervalMs` while online, a probe of the API while the session is offline but the
 * browser is online (a probe that reaches the API runs the drain and the sync, and the session
 * goes online once they succeeded), and the lock dates checked every minute. Returns the stop
 * function.
 */
export function startOfflineRuntime(): () => void {
  refreshOfflineDeviceState();
  if (!isOfflineConfigured()) return () => {};
  const config = getOfflineConfig();

  let running: Promise<void> | undefined;
  let goingOnlineAfterSync = false;
  /**
   * Drain then sync. `reconnect`: a probe reached the API while the session is offline; the
   * session stays offline during the drain and the sync and goes online only when both ran
   * without a network failure (spec § 4: offline "until a sync succeeds").
   */
  const run = (reconnect: boolean): Promise<void> => {
    if (!running) {
      running = (async () => {
        let succeeded = false;
        if (reconnect) setReconnecting(true);
        try {
          const drained = await drainQueue();
          if (drained.stoppedForLogin) {
            await signInExpired();
            return;
          }
          writeReloadMarker(null);
          if (reconnect ? !isReconnecting() : !getOfflineState().online) return;
          await syncAll();
          succeeded = reconnect && isReconnecting();
        } catch (error) {
          warnUnlessUnavailable("[offline] background sync failed")(error);
        } finally {
          if (reconnect) setReconnecting(false);
          running = undefined;
          if (succeeded) {
            goingOnlineAfterSync = true;
            setOfflineState({ online: true });
            goingOnlineAfterSync = false;
            // Changes queued while the attempt ran (an edit, a resolved conflict) waited because
            // the session was still offline: they are sent now, not at the next sync interval.
            if (getOfflineState().pending > 0) {
              drainQueue().catch(warnUnlessUnavailable("[offline] sending the waiting changes failed"));
            }
          }
        }
      })();
    }
    return running;
  };
  const runOnline = () => run(false);

  let probing = false;
  const probe = async () => {
    if (probing || running || getOfflineState().online) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    probing = true;
    try {
      if (await probeApi()) await run(true);
    } catch (error) {
      warnUnlessUnavailable("[offline] probing the API failed")(error);
    } finally {
      probing = false;
    }
  };

  // The browser says the network is back: probe the API now (the state stays offline until then).
  const onBrowserOnline = () => void probe();
  if (typeof window !== "undefined") window.addEventListener("online", onBrowserOnline);

  let wasOnline = getOfflineState().online;
  const unsubscribe = subscribeOfflineState((state) => {
    // The browser cannot keep the device copy: offline mode is off for the page.
    if (!state.available) {
      stop();
      return;
    }
    // Online after a reconnect attempt: its drain and sync already ran.
    if (state.online && !wasOnline && !goingOnlineAfterSync) void runOnline();
    wasOnline = state.online;
  });

  void refreshLockedRoots().catch(warnUnlessUnavailable("[offline] lock check failed"));
  void refreshOfflineCounts().catch(warnUnlessUnavailable("[offline] reading the queue failed"));
  if (getOfflineState().online) void runOnline();

  const syncTimer = setInterval(() => {
    if (getOfflineState().online) void runOnline();
  }, config.syncIntervalMs);
  const probeTimer = setInterval(() => void probe(), PROBE_INTERVAL_MS);
  const lockTimer = setInterval(() => {
    void refreshLockedRoots().catch(warnUnlessUnavailable("[offline] lock check failed"));
  }, LOCK_CHECK_INTERVAL_MS);

  const stop = () => {
    _runningRuntimes.delete(stop);
    clearInterval(syncTimer);
    clearInterval(probeTimer);
    clearInterval(lockTimer);
    if (typeof window !== "undefined") window.removeEventListener("online", onBrowserOnline);
    unsubscribe();
  };
  _runningRuntimes.add(stop);
  return stop;
}
