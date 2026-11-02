// Kept free of React: `directFetch` (every entry, server ones included) imports this module.
// The hooks live in state-hooks.ts, exported only from the `./offline` entry.

export type OfflineState = {
  online: boolean;
  pending: number;
  conflicts: number;
  draining: boolean;
  lockedRootIds: string[];
  /**
   * False once this browser was found unable to keep the device copy (no secure context, no
   * private file storage, or the worker reports the OPFS APIs missing). Offline mode is then off
   * for the rest of the page: `isOfflineConfigured()` answers false and nothing offline runs.
   */
  available: boolean;
  /**
   * Offline mode is on on this device for the signed-in user. Always true once configured
   * without `OfflineConfig.requireOptIn`; otherwise the GM's per-device switch.
   */
  enabled: boolean;
  /** The running full sync: root records done out of the total, null when no sync runs. */
  syncProgress: { done: number; total: number } | null;
  /** When the last full sync on this device finished (epoch ms), null when never. */
  lastSyncedAt: number | null;
  /** How many root records the last full sync kept on this device, null when unknown. */
  rootCount: number | null;
};

export const SERVER_SNAPSHOT: OfflineState = {
  online: true,
  pending: 0,
  conflicts: 0,
  draining: false,
  lockedRootIds: [],
  available: true,
  enabled: false,
  syncProgress: null,
  lastSyncedAt: null,
  rootCount: null,
};

let _state: OfflineState = { ...SERVER_SNAPSHOT };
const _listeners = new Set<(s: OfflineState) => void>();
let _detachBrowserEvents: (() => void) | null = null;

export function getOfflineState(): OfflineState {
  return _state;
}

export function subscribeOfflineState(listener: (s: OfflineState) => void): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }
  return a === b;
}

// A reconnect attempt: a probe reached the API while the session is offline. The session stays
// offline (spec § 4: offline "until a sync succeeds") while the drain and the sync run; their
// reads and the change-set request go to the network meanwhile (`reachesNetworkWhileOffline`).
// Any network failure (`online: false` set again) ends the attempt.
let _reconnecting = false;
const _passThroughUrls = new Set<string>();

/** Whether a reconnect attempt (drain then sync, after a probe reached the API) is running. */
export function isReconnecting(): boolean {
  return _reconnecting;
}

/** Starts or ends a reconnect attempt (the offline runtime). */
export function setReconnecting(value: boolean): void {
  _reconnecting = value;
  if (!value) _passThroughUrls.clear();
}

/** Lets one write (the drain's change-set request) reach the network during a reconnect attempt. */
export function allowWhileReconnecting(url: string): () => void {
  _passThroughUrls.add(url);
  return () => {
    _passThroughUrls.delete(url);
  };
}

/**
 * While the session is offline, whether a request still goes to the network: only during a
 * reconnect attempt, for a GET or a write the attempt let through. Any other write stays local
 * (queued), so it is sent after the waiting changes, in order.
 */
export function reachesNetworkWhileOffline(method: string, url: string): boolean {
  if (!_reconnecting) return false;
  return method.toUpperCase() === "GET" || _passThroughUrls.has(url);
}

/** The sync and the drain may talk to the API: online, or during a reconnect attempt. */
export function canReachApi(): boolean {
  return _state.online || _reconnecting;
}

/** Applies a partial change. Listeners run once, and only when a value actually changed. */
export function setOfflineState(patch: Partial<OfflineState>): void {
  if (patch.online === false) setReconnecting(false);
  const changed = (Object.keys(patch) as (keyof OfflineState)[]).some(
    (key) => patch[key] !== undefined && !sameValue(patch[key], _state[key]),
  );
  if (!changed) return;

  _state = { ..._state, ...patch };
  for (const listener of [..._listeners]) listener(_state);
}

/**
 * Follows the browser's offline event. Called by `configureOffline`, never at import, so an app
 * that does not opt in gets no listener. The browser's online event alone never brings the
 * session back online (spec § 4: offline "until a sync succeeds"): the runtime probes the API on
 * that event and goes online only when the probe reaches it.
 */
export function attachBrowserOnlineEvents(): void {
  if (_detachBrowserEvents || typeof window === "undefined") return;

  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
    setOfflineState({ online: navigator.onLine });
  }

  const onOffline = () => setOfflineState({ online: false });
  window.addEventListener("offline", onOffline);
  _detachBrowserEvents = () => {
    window.removeEventListener("offline", onOffline);
  };
}

/** Test helper: back to the initial state, browser events detached, listeners kept. */
export function resetOfflineState(): void {
  _detachBrowserEvents?.();
  _detachBrowserEvents = null;
  setReconnecting(false);
  _state = { ...SERVER_SNAPSHOT };
}
