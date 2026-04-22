import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { groupThreadsByBucket } from "../groupThreadsByBucket";

describe("groupThreadsByBucket", () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date("2026-04-22T12:00:00Z")));
  afterEach(() => vi.useRealTimers());

  it("buckets today, thisWeek, earlier by updatedAt", () => {
    const today = { id: "1", updatedAt: new Date("2026-04-22T09:00:00Z") } as any;
    const weekAgo2 = { id: "2", updatedAt: new Date("2026-04-20T09:00:00Z") } as any;
    const earlier = { id: "3", updatedAt: new Date("2026-03-01T09:00:00Z") } as any;
    const grouped = groupThreadsByBucket([today, weekAgo2, earlier]);
    expect(grouped.today).toEqual([today]);
    expect(grouped.thisWeek).toEqual([weekAgo2]);
    expect(grouped.earlier).toEqual([earlier]);
  });

  it("sorts each bucket by updatedAt desc", () => {
    const a = { id: "a", updatedAt: new Date("2026-04-22T09:00:00Z") } as any;
    const b = { id: "b", updatedAt: new Date("2026-04-22T10:00:00Z") } as any;
    const grouped = groupThreadsByBucket([a, b]);
    expect(grouped.today).toEqual([b, a]);
  });
});
