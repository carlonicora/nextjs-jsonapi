/**
 * The device-copy worker: loads the official SQLite WebAssembly build, opens
 * the signed-in user's file `nja-offline-<userId>.sqlite3` in the Origin
 * Private File System and answers `exec` messages from `worker-client.ts`.
 *
 * VFS: the "opfs" VFS when the page is cross-origin isolated (it needs
 * SharedArrayBuffer); otherwise the "opfs-sahpool" VFS, which needs no
 * COOP/COEP headers, registered per user in the OPFS directory
 * `.nja-offline-<userId>` so the user id is still in the stored name.
 */
import type { Database, default as Sqlite3InitModule } from "@sqlite.org/sqlite-wasm";

// SQLite is loaded at run time from the URL the page sends with "open" (OfflineConfig.sqliteModuleUrl),
// never bundled: its own helper worker uses a computed URL that app bundlers refuse.
const loadSqlite = async (moduleUrl: string): Promise<typeof Sqlite3InitModule> =>
  (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ moduleUrl)).default;

export type WorkerRequest =
  | { id: number; op: "open"; userId: string; fileName: string; sqliteModuleUrl: string }
  | { id: number; op: "exec"; sql: string; bind?: unknown[] }
  | { id: number; op: "close" };

export type WorkerResponse = { id: number; ok: true; result: unknown } | { id: number; ok: false; error: string };

let db: Database | undefined;

const reply = (response: WorkerResponse) =>
  (self as unknown as { postMessage: (m: WorkerResponse) => void }).postMessage(response);

const fileExists = async (fileName: string): Promise<boolean> => {
  const root = await navigator.storage.getDirectory();
  try {
    await root.getFileHandle(fileName);
    return true;
  } catch {
    return false;
  }
};

const open = async (
  userId: string,
  fileName: string,
  sqliteModuleUrl: string,
): Promise<{ created: boolean; vfs: string }> => {
  if (db) throw new Error("The device database is already open in this worker.");
  const sqlite3InitModule = await loadSqlite(new URL(sqliteModuleUrl, self.location.href).href);
  const sqlite3 = await sqlite3InitModule();
  if (sqlite3.oo1.OpfsDb) {
    const created = !(await fileExists(fileName));
    db = new sqlite3.oo1.OpfsDb(`/${fileName}`, "c");
    return { created, vfs: "opfs" };
  }
  const pool = await sqlite3.installOpfsSAHPoolVfs({
    name: `nja-offline-${userId}`,
    directory: `.nja-offline-${userId}`,
  });
  const created = !pool.getFileNames().includes(`/${fileName}`);
  db = new pool.OpfsSAHPoolDb(`/${fileName}`);
  return { created, vfs: "opfs-sahpool" };
};

const exec = (sql: string, bind?: unknown[]): Record<string, unknown>[] => {
  if (!db) throw new Error("The device database is not open.");
  return db.exec({
    sql,
    bind: bind && bind.length ? (bind as any) : undefined,
    rowMode: "object",
    returnValue: "resultRows",
  }) as Record<string, unknown>[];
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    let result: unknown;
    if (request.op === "open") result = await open(request.userId, request.fileName, request.sqliteModuleUrl);
    else if (request.op === "exec") result = exec(request.sql, request.bind);
    else {
      db?.close();
      db = undefined;
      result = null;
    }
    reply({ id: request.id, ok: true, result });
  } catch (error) {
    reply({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
