"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Modules, NextRef } from "../../../core";
import { SharedProvider } from "../../../contexts";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { AnalyticsAdminFilterBar } from "../components/AnalyticsAdminFilterBar";
import type { AnalyticsBreakdownInterface } from "../data/analytics-breakdown.interface";
import type { AnalyticsSessionInterface } from "../data/analytics-session.interface";
import type { AnalyticsSummaryInterface } from "../data/analytics-summary.interface";
import type { AnalyticsTimelineInterface } from "../data/analytics-timeline.interface";
import {
  ANALYTICS_DIMENSIONS,
  type AnalyticsDimension,
  type AnalyticsGranularity,
  type AnalyticsSection,
} from "../data/analytics.types";
import { AnalyticsAdminService } from "../data/AnalyticsAdminService";

/**
 * Default route the breadcrumb links back to. A host app that mounts the page
 * elsewhere overrides it with the `pageUrl` prop — the constant stays here
 * because the breadcrumb is built by this provider, not by the app.
 */
const ANALYTICS_ADMIN_PAGE_URL = "/administration/analytics";

/** Default base route of the journey page each session row links to. */
const ANALYTICS_SESSION_PAGE_URL = "/administration/analytics/sessions";

/** Rows kept per breakdown tab before the repository folds the tail into "other". */
const BREAKDOWN_LIMIT = 20;

/** The window the page opens on, in days. */
const DEFAULT_RANGE_DAYS = 30;

const EMPTY_BREAKDOWNS: Record<AnalyticsDimension, AnalyticsBreakdownInterface[]> = {
  source: [],
  medium: [],
  campaign: [],
  referrer: [],
  route: [],
  landing: [],
};

export type AnalyticsAdminFilterState = {
  /** ISO 8601 instant. */
  from: string;
  /** ISO 8601 instant. */
  to: string;
  section: AnalyticsSection;
  granularity: AnalyticsGranularity;
};

export interface AnalyticsAdminContextType {
  /** The six summary rows: {public, app, total} × {current, previous}. */
  summary: AnalyticsSummaryInterface[];
  timeline: AnalyticsTimelineInterface[];
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
  /** Route the breadcrumb links back to. */
  pageUrl?: string;
  /** Base route of the journey page each session row links to. */
  sessionPageUrl?: string;
};

/**
 * Owns every filter the administrative analytics page reads, fetches the panels
 * behind it, and publishes the filter bar into the page title bar.
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
  pageUrl = ANALYTICS_ADMIN_PAGE_URL,
  sessionPageUrl = ANALYTICS_SESSION_PAGE_URL,
}: AnalyticsAdminProviderProps) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const [filters, setFilterState] = useState<AnalyticsAdminFilterState>(() => {
    const range = defaultRange();
    return {
      from: initialFrom ?? range.from,
      to: initialTo ?? range.to,
      section: "all",
      granularity: "day",
    };
  });

  const [summary, setSummary] = useState<AnalyticsSummaryInterface[]>([]);
  const [timeline, setTimeline] = useState<AnalyticsTimelineInterface[]>([]);
  const [breakdowns, setBreakdowns] =
    useState<Record<AnalyticsDimension, AnalyticsBreakdownInterface[]>>(EMPTY_BREAKDOWNS);
  const [sessions, setSessions] = useState<AnalyticsSessionInterface[]>([]);
  /** The cursor URL of the next sessions page, as the API returned it. */
  const [sessionsNextPage, setSessionsNextPage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { from, to, section, granularity } = filters;

  useEffect(() => {
    // `cancelled` is the out-of-order guard: a filter change fires a new request
    // while the previous one is still in flight, and without this flag the slower
    // (older) response would land last and overwrite the fresher state.
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const base = { from, to, section };
    // callApi writes the response's next-page link into this ref.
    const sessionsNext: NextRef = {};

    Promise.all([
      AnalyticsAdminService.getSummary(base),
      AnalyticsAdminService.getTimeline({ ...base, granularity }),
      Promise.all(
        ANALYTICS_DIMENSIONS.map((dimension) =>
          AnalyticsAdminService.getBreakdown({ ...base, dimension, limit: BREAKDOWN_LIMIT }),
        ),
      ),
      AnalyticsAdminService.getSessions({ ...base, next: sessionsNext }),
    ])
      .then(([nextSummary, nextTimeline, nextBreakdowns, nextSessions]) => {
        if (cancelled) return;
        setSummary(nextSummary ?? []);
        setTimeline(nextTimeline ?? []);
        setBreakdowns(
          Object.fromEntries(
            ANALYTICS_DIMENSIONS.map((dimension, index) => [dimension, nextBreakdowns[index] ?? []]),
          ) as Record<AnalyticsDimension, AnalyticsBreakdownInterface[]>,
        );
        setSessions(nextSessions ?? []);
        setSessionsNextPage(sessionsNext.next);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load analytics:", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, section, granularity]);

  const setFilters = useCallback((next: Partial<AnalyticsAdminFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...next }));
  }, []);

  const loadMoreSessions = useCallback(async () => {
    if (!sessionsNextPage) return;

    const sessionsNext: NextRef = {};
    try {
      const nextSessions = await AnalyticsAdminService.next<AnalyticsSessionInterface[]>({
        type: Modules.AnalyticsSession,
        endpoint: sessionsNextPage,
        next: sessionsNext,
      });
      setSessions((prev) => [...prev, ...(nextSessions ?? [])]);
      setSessionsNextPage(sessionsNext.next);
    } catch (err) {
      console.error("Failed to load more analytics sessions:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [sessionsNextPage]);

  const breadcrumb = (): BreadcrumbItemData[] => [
    {
      name: t("analytics.admin.title"),
      href: generateUrl({ page: pageUrl }),
    },
  ];

  const title = () => ({
    type: t("analytics.admin.title"),
    functions: (
      <AnalyticsAdminFilterBar
        key="analyticsAdminFilterBar"
        from={from}
        to={to}
        section={section}
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
