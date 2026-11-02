import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openSharedDatabase, withDatabaseReleased } from "../shared-database";
import type { OpenedDatabase } from "../worker-client";

/** A minimal Web Locks manager shared by every simulated page (exclusive locks, a FIFO queue). */
function fakeLocks() {
  const held = new Set<string>();
  const queues = new Map<string, (() => void)[]>();
  const next = (name: string) => {
    const waiting = queues.get(name);
    const run = waiting?.shift();
    if (run) run();
    else held.delete(name);
  };
  return {
    request(name: string, ...args: any[]): Promise<unknown> {
      const callback = args[args.length - 1] as (lock: unknown) => Promise<unknown>;
      const options = (args.length > 1 ? args[0] : {}) as { ifAvailable?: boolean; signal?: AbortSignal };
      return new Promise((resolve, reject) => {
        const grant = () => {
          Promise.resolve(callback({ name }))
            .then(resolve, reject)
            .finally(() => next(name));
        };
        if (!held.has(name)) {
          held.add(name);
          grant();
          return;
        }
        if (options.ifAvailable) {
          Promise.resolve(callback(null)).then(resolve, reject);
          return;
        }
        const queue = queues.get(name) ?? [];
        queue.push(grant);
        queues.set(name, queue);
        options.signal?.addEventListener("abort", () => {
          const index = queue.indexOf(grant);
          if (index >= 0) queue.splice(index, 1);
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });
    },
    query: async () => ({ held: [...held].map((name) => ({ name })) }),
  };
}

/** A fake database recording every statement, in order, with the page that sent it. */
function fakeDatabase(log: string[], label: string): OpenedDatabase {
  return {
    created: true,
    exec: async (sql) => {
      log.push(`${label}:${sql}`);
      await new Promise((resolve) => setTimeout(resolve, 1));
      return [{ sql }];
    },
    close: vi.fn(async () => undefined),
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("shared device database", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { ...navigator, locks: fakeLocks() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("the first page holds the database; a second page sends its statements to it and gets the answers", async () => {
    const log: string[] = [];
    const openA = vi.fn(async () => fakeDatabase(log, "files"));
    const openB = vi.fn(async () => fakeDatabase(log, "never"));

    const a = await openSharedDatabase("u1", openA);
    const b = await openSharedDatabase("u1", openB);

    expect(openA).toHaveBeenCalledTimes(1);
    expect(openB).not.toHaveBeenCalled();
    expect(await b.exclusive(() => b.exec("SELECT 1"))).toEqual([{ sql: "SELECT 1" }]);
    expect(log).toEqual(["files:SELECT 1"]);

    await b.close();
    await a.close();
  });

  it("a transaction of one page never interleaves with another page's statements", async () => {
    const log: string[] = [];
    const a = await openSharedDatabase("u2", async () => fakeDatabase(log, "db"));
    const b = await openSharedDatabase("u2", async () => fakeDatabase(log, "never"));

    await Promise.all([
      b.exclusive(async () => {
        await b.exec("BEGIN");
        await b.exec("B1");
        await b.exec("COMMIT");
      }),
      a.exclusive(async () => {
        await a.exec("BEGIN");
        await a.exec("A1");
        await a.exec("COMMIT");
      }),
    ]);

    const statements = log.map((line) => line.split(":")[1]);
    const firstCommit = statements.indexOf("COMMIT");
    expect(statements.slice(0, firstCommit + 1)).toHaveLength(3);
    expect(statements.slice(firstCommit + 1)).toHaveLength(3);
    expect(new Set(statements.slice(0, 3))).not.toEqual(new Set(["BEGIN", "A1", "B1"]));

    await b.close();
    await a.close();
  });

  it("when the holder closes, the waiting page takes over, opening the files itself (retrying while they are released)", async () => {
    const log: string[] = [];
    const a = await openSharedDatabase("u3", async () => fakeDatabase(log, "a"));
    let attempts = 0;
    const openB = vi.fn(async () => {
      attempts++;
      if (attempts === 1) throw new Error("NoModificationAllowedError: Access Handles cannot be created");
      return fakeDatabase(log, "b");
    });
    const b = await openSharedDatabase("u3", openB);

    await a.close();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(openB).toHaveBeenCalledTimes(2);
    expect(await b.exclusive(() => b.exec("SELECT 2"))).toEqual([{ sql: "SELECT 2" }]);
    expect(log).toEqual(["b:SELECT 2"]);
    await b.close();
  });

  it("withDatabaseReleased closes the copy in every page before running the removal", async () => {
    const log: string[] = [];
    const database = fakeDatabase(log, "a");
    const onShutdown = vi.fn();
    await openSharedDatabase("u4", async () => database, onShutdown);

    const removal = vi.fn(async () => "removed");
    expect(await withDatabaseReleased("u4", removal)).toBe("removed");
    await settle();

    expect(database.close).toHaveBeenCalled();
    expect(onShutdown).toHaveBeenCalled();
    expect(removal).toHaveBeenCalledTimes(1);
  });
});
