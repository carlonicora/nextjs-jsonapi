"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Modules, NextRef } from "../../../core";
import { SharedProvider } from "../../../contexts";
import { BreadcrumbItemData } from "../../../interfaces";
import { AnalyticsAdminFilterBar } from "../components/AnalyticsAdminFilterBar";
import type { AnalyticsBreakdownInterface } from "../data/analytics-breakdown.interface";
import type { AnalyticsSessionInterface } from "../data/analytics-session.interface";
import type { AnalyticsSummaryInterface } from "../data/analytics-summary.interface";
import type { AnalyticsTimelineInterface } from "../data/analytics-timeline.interface";
import {
  ANALYTICS_AUDIENCE_BREAKDOWNS,
  type AnalyticsAudience,
  type AnalyticsDimension,
  type AnalyticsGranularity,
} from "../data/analytics.types";
import { AnalyticsAdminService } from "../data/AnalyticsAdminService";

/** Default base route of the journey page each session row links to. */
const ANALYTICS_SESSION_PAGE_URL = "/administration/analytics/sessions";

/** The window the page opens on, in days. */
const DEFAULT_RANGE_DAYS = 30;

/** Every dimension empty: the base the selected tab's fetched dimensions are merged onto. */
const emptyBreakdowns = (): Record<AnalyticsDimension, AnalyticsBreakdownInterface[]> => ({
  source: [],
  medium: [],
  campaign: [],
  referrer: [],
  route: [],
  landing: [],
  exit: [],
});

export type AnalyticsAdminFilterState = {
  /** ISO 8601 instant. */
  from: string;
  /** ISO 8601 instant. */
  to: string;
  /** The selected tab. Defaults to "visitors". */
  audience: AnalyticsAudience;
  /** Defaults to "day". */
  granularity: AnalyticsGranularity;
};

/** The filter keys whose change refetches the selected tab. */
const FETCH_KEYS = [
  "from",
  "to",
  "audience",
  "granularity",
] as const satisfies readonly (keyof AnalyticsAdminFilterState)[];

export interface AnalyticsAdminContextType {
  /** Two rows: total × {current, previous}, for the selected audience. */
  summary: AnalyticsSummaryInterface[];
  timeline: AnalyticsTimelineInterface[];
  /** Dimensions the selected tab did not fetch are []. */
  breakdowns: Record<AnalyticsDimension, AnalyticsBreakdownInterface[]>;
  sessions: AnalyticsSessionInterface[];
  filters: AnalyticsAdminFilterState;
  /** Merges a partial patch into the current filters; every key is optional. */
  setFilters: (next: Partial<AnalyticsAdminFilterState>) => void;
  /** Appends the next page of sessions; a no-op when there is none. */
  loadMoreSessions: () => Promise<void>;
  hasMoreSessions: boolean;
  /** Base route of the journey page, as passed to the provider. */
  sessionPageUrl: string;
  isLoading: boolean;
  error: string | null;
}

const AnalyticsAdminContext = createContext<AnalyticsAdminContextType | undefined>(undefined);

/** The last 30 days up to now, which is the window the page opens on. */
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: now.toISOString() };
}

type AnalyticsAdminProviderProps = {
  children: ReactNode;
  /** ISO 8601 instant. Defaults to 30 days ago. */
  initialFrom?: string;
  /** ISO 8601 instant. Defaults to now. */
  initialTo?: string;
  /**
   * @deprecated No longer read. This provider only serves the dashboard, which
   * is the current page, so its breadcrumb is not linked. Kept so existing
   * callers still compile.
   */
  pageUrl?: string;
  /** Base route of the journey page each session row links to. */
  sessionPageUrl?: string;
};

/**
 * Owns every filter the administrative analytics page reads (the selected
 * audience tab included), fetches only that tab's panels, and publishes the
 * filter bar into the page title bar.
 *
 * The filter bar is rendered into `title.functions` here — NOT in the container —
 * because `RoundPageContainer`'s title bar reads `title.functions` from
 * `SharedContext`, and a descendant cannot inject nodes into an ancestor's
 * provider value. That is why the filter state lives at this level.
 */
export const AnalyticsAdminProvider = ({
  children,
  initialFrom,
  initialTo,
  sessionPageUrl = ANALYTICS_SESSION_PAGE_URL,
}: AnalyticsAdminProviderProps) => {
  const t = useTranslations();

  const [filters, setFilterState] = useState<AnalyticsAdminFilterState>(() => {
    const range = defaultRange();
    return {
      from: initialFrom ?? range.from,
      to: initialTo ?? range.to,
      audience: "visitors",
      granularity: "day",
    };
  });

  const [summary, setSummary] = useState<AnalyticsSummaryInterface[]>([]);
  const [timeline, setTimeline] = useState<AnalyticsTimelineInterface[]>([]);
  const [breakdowns, setBreakdowns] =
    useState<Record<AnalyticsDimension, AnalyticsBreakdownInterface[]>>(emptyBreakdowns);
  const [sessions, setSessions] = useState<AnalyticsSessionInterface[]>([]);
  /** The cursor URL of the next sessions page, as the API returned it. */
  const [sessionsNextPage, setSessionsNextPage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * The out-of-order guard: every fetch bumps it, and a response (panels or
   * Load more) whose captured value no longer matches is dropped, so a fast
   * A to B to A switch never shows B's data on A.
   */
  const requestRef = useRef(0);

  const { from, to, audience, granularity } = filters;

  useEffect(() => {
    const request = ++requestRef.current;
    const isStale = () => requestRef.current !== request;

    setIsLoading(true);
    setError(null);

    const base = { from, to, audience };
    const tabBreakdowns = ANALYTICS_AUDIENCE_BREAKDOWNS[audience];
    // callApi writes the response's next-page link into this ref.
    const sessionsNext: NextRef = {};

    Promise.all([
      AnalyticsAdminService.getSummary(base),
      AnalyticsAdminService.getTimeline({ ...base, granularity }),
      Promise.all(
        tabBreakdowns.map(({ dimension, limit }) => AnalyticsAdminService.getBreakdown({ ...base, dimension, limit })),
      ),
      AnalyticsAdminService.getSessions({ ...base, next: sessionsNext }),
    ])
      .then(([nextSummary, nextTimeline, nextBreakdowns, nextSessions]) => {
        if (isStale()) return;
        setSummary(nextSummary ?? []);
        setTimeline(nextTimeline ?? []);
        const merged = emptyBreakdowns();
        tabBreakdowns.forEach(({ dimension }, index) => {
          merged[dimension] = nextBreakdowns[index] ?? [];
        });
        setBreakdowns(merged);
        setSessions(nextSessions ?? []);
        setSessionsNextPage(sessionsNext.next);
      })
      .catch((err) => {
        if (isStale()) return;
        console.error("Failed to load analytics:", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (isStale()) return;
        setIsLoading(false);
      });
  }, [from, to, audience, granularity]);

  // A change that refetches flips isLoading in the same update as the filters,
  // so no render shows the new tab or period with the old one's data.
  const setFilters = useCallback(
    (next: Partial<AnalyticsAdminFilterState>) => {
      const refetches = FETCH_KEYS.some((key) => next[key] !== undefined && next[key] !== filters[key]);
      setFilterState((prev) => ({ ...prev, ...next }));
      if (refetches) setIsLoading(true);
    },
    [filters],
  );

  const loadMoreSessions = useCallback(async () => {
    if (!sessionsNextPage) return;

    const request = requestRef.current;
    const sessionsNext: NextRef = {};
    try {
      const nextSessions = await AnalyticsAdminService.next<AnalyticsSessionInterface[]>({
        type: Modules.AnalyticsSession,
        endpoint: sessionsNextPage,
        next: sessionsNext,
      });
      // The tab or filters changed while this page was in flight: it belongs to the old list.
      if (requestRef.current !== request) return;
      setSessions((prev) => [...prev, ...(nextSessions ?? [])]);
      setSessionsNextPage(sessionsNext.next);
    } catch (err) {
      // The list and the Load more button stay; the page error is for the panels only.
      console.error("Failed to load more analytics sessions:", err);
    }
  }, [sessionsNextPage]);

  // Unlinked: this provider only serves the dashboard, so the root is always
  // the current page. The journey page publishes its own linked breadcrumb.
  const breadcrumb = (): BreadcrumbItemData[] => [{ name: t("analytics.admin.title") }];

  const title = () => ({
    type: t("analytics.admin.title"),
    functions: (
      <AnalyticsAdminFilterBar
        key="analyticsAdminFilterBar"
        from={from}
        to={to}
        granularity={granularity}
        onChange={setFilters}
      />
    ),
  });

  const hasMoreSessions = Boolean(sessionsNextPage);

  const contextValue = useMemo<AnalyticsAdminContextType>(
    () => ({
      summary,
      timeline,
      breakdowns,
      sessions,
      filters,
      setFilters,
      loadMoreSessions,
      hasMoreSessions,
      sessionPageUrl,
      isLoading,
      error,
    }),
    [
      summary,
      timeline,
      breakdowns,
      sessions,
      filters,
      setFilters,
      loadMoreSessions,
      hasMoreSessions,
      sessionPageUrl,
      isLoading,
      error,
    ],
  );

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <AnalyticsAdminContext.Provider value={contextValue}>{children}</AnalyticsAdminContext.Provider>
    </SharedProvider>
  );
};

export const useAnalyticsAdmin = (): AnalyticsAdminContextType => {
  const ctx = useContext(AnalyticsAdminContext);
  if (!ctx) {
    throw new Error("useAnalyticsAdmin() called outside <AnalyticsAdminProvider>.");
  }
  return ctx;
};
