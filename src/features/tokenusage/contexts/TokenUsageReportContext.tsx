"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { TokenUsageReportFilterBar } from "../components/TokenUsageReportFilterBar";
import type { TokenUsageReportBreakdownInterface } from "../data/tokenusage-report-breakdown.interface";
import type { TokenUsageReportSummaryInterface } from "../data/tokenusage-report-summary.interface";
import type { TokenUsageReportTimelineInterface } from "../data/tokenusage-report-timeline.interface";
import type { ReportMetric } from "../data/tokenusage-report.types";
import { TokenUsageReportService } from "../data/TokenUsageReportService";

/** Default page the breadcrumb links back to; overridable per host app. */
const TOKEN_USAGE_REPORT_PAGE_URL = "/tokenusage";

/** Rows kept per ranked panel before the backend folds the tail into "other". */
const DEFAULT_TOP_N = 10;

/**
 * The unit this surface reports in, always. A game master is billed in credits,
 * so credits are the only number that means anything to them: cost would leak
 * platform margin and a raw token count is an implementation detail nobody is
 * charged for. Pinned rather than exposed as a filter — there is no metric
 * selector on the page.
 */
const REPORT_METRIC: ReportMetric = "credits";

export type TokenUsageReportFilterState = {
  /** ISO 8601 instant. */
  from: string;
  /** ISO 8601 instant. */
  to: string;
};

export interface TokenUsageReportContextType {
  summary: TokenUsageReportSummaryInterface[];
  timeline: TokenUsageReportTimelineInterface[];
  byOperation: TokenUsageReportBreakdownInterface[];
  /** Empty unless the host app declared a targetLabel. */
  byTarget: TokenUsageReportBreakdownInterface[];
  /** i18n key for the target panel's title; undefined when the host set no targetLabel. */
  targetPanelTitleKey?: string;
  filters: TokenUsageReportFilterState;
  /** Merges a partial patch into the current filters; every key is optional. */
  setFilters: (next: Partial<TokenUsageReportFilterState>) => void;
  isLoading: boolean;
  error: string | null;
}

const TokenUsageReportContext = createContext<TokenUsageReportContextType | undefined>(undefined);

/** Current calendar month to now, which is the window the page opens on. */
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return { from: start.toISOString(), to: now.toISOString() };
}

type TokenUsageReportProviderProps = {
  children: ReactNode;
  /**
   * The Neo4j label the "by target" panel groups by, e.g. "Campaign". The set of
   * things usage can be attributed to is application-specific, so the package
   * cannot pick one — omit it and the panel is skipped rather than rendered
   * empty, and no request is issued.
   */
  targetLabel?: string;
  /** i18n key for the target panel's title. Required when targetLabel is set. */
  targetPanelTitleKey?: string;
  /** ISO 8601 instant. Defaults to the start of the current month. */
  initialFrom?: string;
  /** ISO 8601 instant. Defaults to now. */
  initialTo?: string;
  /** Rows per ranked panel. Defaults to 10. */
  topN?: number;
  /** Route the breadcrumb links back to. */
  pageUrl?: string;
};

/**
 * Owns the date range of the self-service token-usage page, fetches the three
 * panels behind it, and publishes the filter bar into the page title bar.
 *
 * The filter bar is rendered into `title.functions` here — NOT in the container —
 * because `RoundPageContainer`'s title bar reads `title.functions` from
 * `SharedContext`, and a descendant cannot inject nodes into an ancestor's
 * provider value. That is why the filter state lives at this level.
 */
export const TokenUsageReportProvider = ({
  children,
  targetLabel,
  targetPanelTitleKey,
  initialFrom,
  initialTo,
  topN = DEFAULT_TOP_N,
  pageUrl = TOKEN_USAGE_REPORT_PAGE_URL,
}: TokenUsageReportProviderProps) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const [filters, setFilterState] = useState<TokenUsageReportFilterState>(() => {
    const range = defaultRange();
    return { from: initialFrom ?? range.from, to: initialTo ?? range.to };
  });

  const [summary, setSummary] = useState<TokenUsageReportSummaryInterface[]>([]);
  const [timeline, setTimeline] = useState<TokenUsageReportTimelineInterface[]>([]);
  const [byOperation, setByOperation] = useState<TokenUsageReportBreakdownInterface[]>([]);
  const [byTarget, setByTarget] = useState<TokenUsageReportBreakdownInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { from, to } = filters;

  useEffect(() => {
    // `cancelled` is the out-of-order guard: a filter change fires a new request
    // while the previous one is still in flight, and without this flag the slower
    // (older) response would land last and overwrite the fresher state.
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const base = { from, to };

    Promise.all([
      TokenUsageReportService.getSummary(base),
      // granularity is pinned to "day": week/month bucketing buys nothing on the
      // ranges a single tenant browses.
      TokenUsageReportService.getTimeline({ ...base, granularity: "day" }),
      TokenUsageReportService.getBreakdown({ ...base, dimension: "operation", metric: REPORT_METRIC, limit: topN }),
      // No targetLabel means the host app never opted in, so the request is
      // skipped entirely rather than issued and discarded.
      targetLabel
        ? TokenUsageReportService.getBreakdown({
            ...base,
            dimension: "target",
            targetLabel,
            metric: REPORT_METRIC,
            limit: topN,
          })
        : Promise.resolve<TokenUsageReportBreakdownInterface[]>([]),
    ])
      .then(([nextSummary, nextTimeline, nextByOperation, nextByTarget]) => {
        if (cancelled) return;
        setSummary(nextSummary ?? []);
        setTimeline(nextTimeline ?? []);
        setByOperation(nextByOperation ?? []);
        setByTarget(nextByTarget ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load token usage:", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, targetLabel, topN]);

  const setFilters = useCallback((next: Partial<TokenUsageReportFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...next }));
  }, []);

  const breadcrumb = (): BreadcrumbItemData[] => [
    { name: t("token_usage.report.title"), href: generateUrl({ page: pageUrl }) },
  ];

  const title = () => ({
    type: t("token_usage.report.title"),
    functions: <TokenUsageReportFilterBar key="tokenUsageReportFilterBar" onChange={setFilters} />,
  });

  const contextValue = useMemo<TokenUsageReportContextType>(
    () => ({ summary, timeline, byOperation, byTarget, targetPanelTitleKey, filters, setFilters, isLoading, error }),
    [summary, timeline, byOperation, byTarget, targetPanelTitleKey, filters, setFilters, isLoading, error],
  );

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <TokenUsageReportContext.Provider value={contextValue}>{children}</TokenUsageReportContext.Provider>
    </SharedProvider>
  );
};

export const useTokenUsageReport = (): TokenUsageReportContextType => {
  const ctx = useContext(TokenUsageReportContext);
  if (!ctx) {
    throw new Error("useTokenUsageReport() called outside <TokenUsageReportProvider>.");
  }
  return ctx;
};
