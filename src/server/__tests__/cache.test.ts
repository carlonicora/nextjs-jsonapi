import { beforeEach, describe, expect, it, vi } from "vitest";

const nextCache = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => nextCache);

import { CACHE_PROFILES, invalidateCacheTag, invalidateCacheTags, updateCacheTag } from "../cache";

describe("cache helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateCacheTag calls updateTag", async () => {
    await updateCacheTag("help");

    expect(nextCache.updateTag).toHaveBeenCalledWith("help");
    expect(nextCache.revalidateTag).not.toHaveBeenCalled();
  });

  it('invalidateCacheTag defaults to "max"', async () => {
    await invalidateCacheTag("help");

    expect(nextCache.revalidateTag).toHaveBeenCalledWith("help", "max");
  });

  it("invalidateCacheTag passes an explicit profile through", async () => {
    await invalidateCacheTag("help", "hours");

    expect(nextCache.revalidateTag).toHaveBeenCalledWith("help", "hours");
  });

  it("invalidateCacheTags revalidates every tag", async () => {
    await invalidateCacheTags(["a", "b"]);

    expect(nextCache.revalidateTag).toHaveBeenNthCalledWith(1, "a", "max");
    expect(nextCache.revalidateTag).toHaveBeenNthCalledWith(2, "b", "max");
  });

  it("exports the built-in cacheLife profile names", () => {
    expect([...CACHE_PROFILES]).toEqual(["seconds", "minutes", "hours", "days", "weeks", "max", "default"]);
  });
});
