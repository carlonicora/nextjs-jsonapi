import type { ExecFn } from "./sql-device-store";
import type { WorkerRequest, WorkerResponse } from "./worker";

export type OpenedDatabase = {
  exec: ExecFn;
  close: () => Promise<void>;
  /** True when the file did not exist before this open. */
  created: boolean;
};

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };

/** Starts the device-copy worker and opens `fileName` in it for `userId`. */
export async function openWorkerDatabase(
  userId: string,
  fileName: string,
  urls: { workerUrl: string; sqliteModuleUrl: string },
): Promise<OpenedDatabase> {
  // A plain URL, so the app's bundler leaves it alone: the worker is a standalone file the app
  // serves (OfflineConfig.deviceWorkerUrl), precached by the service worker for offline use.
  const worker = new Worker(urls.workerUrl, { type: "module" });
  const { sqliteModuleUrl } = urls;
  const pending = new Map<number, Pending>();
  let nextId = 1;
  let closed = false;

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const waiting = pending.get(response.id);
    if (!waiting) return;
    pending.delete(response.id);
    if (response.ok) waiting.resolve(response.result);
    else waiting.reject(new Error(response.error));
  };
  worker.onerror = (event: ErrorEvent) => {
    const error = new Error(event.message || "The device database worker failed.");
    for (const waiting of pending.values()) waiting.reject(error);
    pending.clear();
  };

  const send = <T>(request: Omit<WorkerRequest, "id"> & { op: WorkerRequest["op"] }): Promise<T> => {
    if (closed) return Promise.reject(new Error("The device database is closed."));
    const id = nextId++;
    return new Promise<T>((resolve, reject) => {
      pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      worker.postMessage({ ...request, id } as WorkerRequest);
    });
  };

  let opened: { created: boolean };
  try {
    opened = await send<{ created: boolean }>({ op: "open", userId, fileName, sqliteModuleUrl } as WorkerRequest);
  } catch (error) {
    worker.terminate();
    throw error;
  }

  return {
    created: opened.created,
    exec: (sql, bind) => send<Record<string, unknown>[]>({ op: "exec", sql, bind } as WorkerRequest),
    close: async () => {
      if (closed) return;
      try {
        await send({ op: "close" } as WorkerRequest);
      } finally {
        closed = true;
        worker.terminate();
      }
    },
  };
}
