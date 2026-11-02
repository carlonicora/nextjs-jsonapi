import type { ExecFn } from "./sql-device-store";
import type { OpenedDatabase } from "./worker-client";

/**
 * One device copy shared by every page of the origin (tabs, the installed app, and the page that
 * is still unloading while the next one loads in the same tab).
 *
 * The browser lets only one page at a time hold the copy's files (opfs-sahpool: one set of access
 * handles per origin). So one page, the holder, opens the database; the others send their
 * statements to it over a BroadcastChannel. The holder is whoever holds the Web Lock
 * `nja-offline-db:<userId>`; every other page waits in that lock's queue and takes over when the
 * holder closes or goes away, retrying the open while the previous holder's files are released.
 *
 * Each store operation runs with exclusive use of the database across all pages (`exclusive`), so
 * a transaction of one page never interleaves with another page's statements.
 */
export type SharedDatabase = OpenedDatabase & {
  /** Runs `fn` with exclusive use of the database across every page. */
  exclusive: <T>(fn: () => Promise<T>) => Promise<T>;
};

type Message =
  | { kind: "holder" }
  | { kind: "lease"; id: string }
  | { kind: "granted"; id: string }
  | { kind: "release"; id: string }
  | { kind: "exec"; id: string; lease: string; sql: string; bind?: unknown[] }
  | { kind: "result"; id: string; ok: true; rows: Record<string, unknown>[] }
  | { kind: "result"; id: string; ok: false; error: string }
  | { kind: "shutdown" };

/** How long the holder keeps a lease for a page that never releases it (the page closed). */
const LEASE_TIMEOUT_MS = 30_000;
/** How long a page waits for an answer before giving up on a statement. */
const EXEC_TIMEOUT_MS = 30_000;
/** How long the next holder keeps retrying the open while the previous holder's files are released. */
const OPEN_RETRY_MS = 10_000;

const lockName = (userId: string) => `nja-offline-db:${userId}`;
const channelName = (userId: string) => `nja-offline-db:${userId}`;

const newId = (): string => globalThis.crypto.randomUUID();

/** Whether this browser offers what sharing needs; without it the page opens the copy directly. */
export function canShareDatabase(): boolean {
  return (
    typeof BroadcastChannel !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.locks?.request === "function"
  );
}

/** The files are still held by the page that had them (it is closing): worth retrying. */
const isHeldElsewhere = (error: unknown): boolean =>
  /NoModificationAllowedError|Access Handles cannot be created|createSyncAccessHandle/i.test(
    String((error as Error)?.message ?? error),
  );

async function openWithRetry(openLocal: () => Promise<OpenedDatabase>): Promise<OpenedDatabase> {
  const deadline = Date.now() + OPEN_RETRY_MS;
  for (let wait = 100; ; wait = Math.min(wait * 2, 1000)) {
    try {
      return await openLocal();
    } catch (error) {
      if (!isHeldElsewhere(error) || Date.now() >= deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

/** A promise chain: one `fn` at a time. */
function createMutex() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(fn: () => Promise<T>): Promise<T> => {
    const run = tail.then(fn, fn);
    tail = run.catch(() => undefined);
    return run;
  };
}

/**
 * Opens the shared device copy of `userId`. `openLocal` opens the database files in this page
 * (the worker); it runs only in the page that holds the lock.
 */
export async function openSharedDatabase(
  userId: string,
  openLocal: () => Promise<OpenedDatabase>,
  /** Called when another page asks every page to close the copy (logout, offline mode off). */
  onShutdown?: () => void,
): Promise<SharedDatabase> {
  const channel = new BroadcastChannel(channelName(userId));
  const post = (message: Message) => channel.postMessage(message);
  const mutex = createMutex();

  let local: OpenedDatabase | undefined;
  let created = false;
  let closed = false;
  let releaseLock: (() => void) | undefined;
  const lockAbort = new AbortController();

  // Holder side: leases granted to other pages, released by them (or after a timeout).
  const leases = new Map<string, () => void>();
  // Page side: leases asked for and not yet granted, and statements waiting for an answer.
  const waitingLeases = new Map<
    string,
    { run: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  const waitingResults = new Map<
    string,
    { resolve: (rows: Record<string, unknown>[]) => void; reject: (e: Error) => void }
  >();
  let currentLease: string | undefined;

  const isHolder = () => local !== undefined;

  /** Runs a lease granted by the holder: `run` sends its statements under that lease. */
  const runGranted = async (id: string) => {
    const waiting = waitingLeases.get(id);
    if (!waiting) {
      post({ kind: "release", id });
      return;
    }
    waitingLeases.delete(id);
    currentLease = id;
    try {
      waiting.resolve(await waiting.run());
    } catch (error) {
      waiting.reject(error as Error);
    } finally {
      currentLease = undefined;
      post({ kind: "release", id });
    }
  };

  channel.onmessage = (event: MessageEvent<Message>) => {
    const message = event.data;
    if (closed) return;
    switch (message.kind) {
      case "holder":
        // A new holder: the lease requests the old one never answered are asked again.
        if (!isHolder()) for (const id of waitingLeases.keys()) post({ kind: "lease", id });
        return;
      case "lease":
        if (!isHolder() || leases.has(message.id)) return;
        void mutex(
          () =>
            new Promise<void>((done) => {
              const timer = setTimeout(() => finish(), LEASE_TIMEOUT_MS);
              const finish = () => {
                clearTimeout(timer);
                leases.delete(message.id);
                done();
              };
              leases.set(message.id, finish);
              post({ kind: "granted", id: message.id });
            }),
        );
        return;
      case "granted":
        if (!isHolder()) void runGranted(message.id);
        return;
      case "release":
        leases.get(message.id)?.();
        return;
      case "exec":
        if (!isHolder() || !leases.has(message.lease)) return;
        local!
          .exec(message.sql, message.bind)
          .then((rows) => post({ kind: "result", id: message.id, ok: true, rows }))
          .catch((error) =>
            post({ kind: "result", id: message.id, ok: false, error: String(error?.message ?? error) }),
          );
        return;
      case "result": {
        const waiting = waitingResults.get(message.id);
        if (!waiting) return;
        waitingResults.delete(message.id);
        if (message.ok) waiting.resolve(message.rows);
        else waiting.reject(new Error(message.error));
        return;
      }
      case "shutdown":
        void close().finally(() => onShutdown?.());
        return;
    }
  };

  const becomeHolder = async () => {
    local = await openWithRetry(openLocal);
    created = local.created;
    // Leases this page asked for and nobody granted: they run here now.
    for (const [id, waiting] of waitingLeases) {
      waitingLeases.delete(id);
      mutex(waiting.run).then(waiting.resolve, waiting.reject);
    }
    post({ kind: "holder" });
  };

  /** Holds the lock as the holder until `close`; the lock passes to the next page when this ends. */
  const holdLock = async (): Promise<void> => {
    if (closed) return;
    await becomeHolder();
    await new Promise<void>((resolve) => (releaseLock = resolve));
  };

  // Free right now: this page is the holder. Held by another page: this page starts as its client
  // and queues for the lock, to take over when the holder leaves.
  let opened: Promise<void> | undefined;
  const isFree = await new Promise<boolean>((answer) => {
    navigator.locks
      .request(lockName(userId), { ifAvailable: true }, async (lock) => {
        if (!lock) {
          answer(false);
          return;
        }
        answer(true);
        opened = becomeHolder();
        try {
          await opened;
        } catch {
          return; // Could not open: the lock is released for the next page.
        }
        await new Promise<void>((resolve) => (releaseLock = resolve));
      })
      .catch(() => answer(false));
  });
  if (isFree) {
    try {
      await opened;
    } catch (error) {
      closed = true;
      channel.close();
      throw error;
    }
  } else {
    navigator.locks.request(lockName(userId), { signal: lockAbort.signal }, holdLock).catch((error) => {
      if ((error as { name?: string })?.name !== "AbortError")
        console.warn("[offline] taking over the device copy failed", error);
    });
  }

  const remoteExec: ExecFn = (sql, bind) => {
    if (closed) return Promise.reject(new Error("The device database is closed."));
    const lease = currentLease;
    if (!lease) return exclusive(() => remoteExec(sql, bind));
    const id = newId();
    return new Promise<Record<string, unknown>[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        waitingResults.delete(id);
        reject(new Error("The page holding the device copy did not answer."));
      }, EXEC_TIMEOUT_MS);
      waitingResults.set(id, {
        resolve: (rows) => {
          clearTimeout(timer);
          resolve(rows);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      post({ kind: "exec", id, lease, sql, bind });
    });
  };

  const exclusive = <T>(fn: () => Promise<T>): Promise<T> => {
    if (closed) return Promise.reject(new Error("The device database is closed."));
    if (isHolder()) return mutex(fn);
    const id = newId();
    return new Promise<T>((resolve, reject) => {
      waitingLeases.set(id, {
        run: fn as () => Promise<unknown>,
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      post({ kind: "lease", id });
    });
  };

  const exec: ExecFn = (sql, bind) => (isHolder() ? local!.exec(sql, bind) : remoteExec(sql, bind));

  async function close(): Promise<void> {
    if (closed) return;
    closed = true;
    lockAbort.abort();
    const error = new Error("The device database is closed.");
    for (const waiting of waitingLeases.values()) waiting.reject(error);
    for (const waiting of waitingResults.values()) waiting.reject(error);
    waitingLeases.clear();
    waitingResults.clear();
    for (const finish of [...leases.values()]) finish();
    try {
      if (local) await local.close();
    } finally {
      local = undefined;
      releaseLock?.();
      channel.close();
    }
  }

  return {
    get created() {
      return created;
    },
    exec,
    exclusive,
    close,
  };
}

/**
 * Asks every page to close the shared copy of `userId`, then runs `fn` once no page holds it
 * (logout, offline mode turned off: the files can only be deleted when nobody has them open).
 */
export async function withDatabaseReleased<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  if (!canShareDatabase()) return fn();
  const channel = new BroadcastChannel(channelName(userId));
  channel.postMessage({ kind: "shutdown" } satisfies Message);
  channel.close();
  return navigator.locks.request(lockName(userId), () => fn()) as Promise<T>;
}
