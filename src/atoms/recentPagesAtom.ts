import { atomWithStorage } from "jotai/utils";

export interface RecentPage {
  url: string;
  title: string;
  moduleType: string;
  timestamp: number;
}

export const recentPagesAtom = atomWithStorage<RecentPage[]>("recentPages", []);
