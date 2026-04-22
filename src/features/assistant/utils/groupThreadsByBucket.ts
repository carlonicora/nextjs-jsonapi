import type { AssistantInterface } from "../data/AssistantInterface";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function groupThreadsByBucket(threads: AssistantInterface[]): {
  today: AssistantInterface[];
  thisWeek: AssistantInterface[];
  earlier: AssistantInterface[];
} {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * MS_PER_DAY;

  const sorted = [...threads].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const today: AssistantInterface[] = [];
  const thisWeek: AssistantInterface[] = [];
  const earlier: AssistantInterface[] = [];
  for (const t of sorted) {
    const ts = t.updatedAt.getTime();
    if (ts >= startOfToday) today.push(t);
    else if (ts >= startOfWeek) thisWeek.push(t);
    else earlier.push(t);
  }
  return { today, thisWeek, earlier };
}
