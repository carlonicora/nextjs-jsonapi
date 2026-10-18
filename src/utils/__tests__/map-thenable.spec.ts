import { describe, expect, it } from "vitest";
import { mapThenable } from "../map-thenable";

// Mirrors React's deserialised server-to-client promise: it inherits from
// Promise.prototype, and its then() registers callbacks but returns undefined.
function chunkLike<T>(value: T): PromiseLike<T> {
  const chunk = Object.create(Promise.prototype);
  chunk.then = (resolve: (v: T) => void) => {
    queueMicrotask(() => resolve(value));
    return undefined;
  };
  return chunk;
}

describe("mapThenable", () => {
  it("returns a native promise for a thenable whose then() returns undefined", async () => {
    const chunk = chunkLike({ isMobile: true });
    expect((chunk.then(() => undefined) as unknown) ?? "undefined").toBe("undefined");

    const mapped = mapThenable(chunk, (s) => s.isMobile);
    expect(mapped).toBeInstanceOf(Promise);
    await expect(mapped).resolves.toBe(true);
  });

  it("propagates a rejection", async () => {
    const failing: PromiseLike<number> = { then: (_ok, fail) => (fail?.(new Error("gone")), undefined as never) };
    await expect(mapThenable(failing, (v) => v)).rejects.toThrow("gone");
  });
});
