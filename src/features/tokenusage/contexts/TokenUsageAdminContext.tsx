"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { TokenUsageAdminFilterBar } from "../components/TokenUsageAdminFilterBar";
import type { TokenUsageAdminBreakdownInterface } from "../data/tokenusage-admin-breakdown.interface";
import type { TokenUsageAdminSummaryInterface } from "../data/tokenusage-admin-summary.interface";
import type { TokenUsageAdminTimelineInterface } from "../data/tokenusage-admin-timeline.interface";
import type { Granularity, Metric, StackBy } from "../data/tokenusage-admin.types";
import { TokenUsageAdminService } from "../data/TokenUsageAdminService";

/**
 * Route the breadcrumb links back to. The page itself lives in the consuming
 * app (a360ai mounts it at `/administration/token-usage`); the constant is here
 * because the breadcrumb is built by this provider, not by the app.
 */
const TOKEN_USAGE_ADMIN_PAGE_URL = "/administration/token-usage";

/** Rows kept per ranked panel before the repository folds the tail into "other". */
const DEFAULT_TOP_N = 10;

export type TokenUsageAdminFilterState = {
  /** ISO 8601 instant. */
  from: string;
  /** ISO 8601 instant. */
  to: string;
  granularity: Granularity;
  stackBy: StackBy;
  companyId?: string;
  metric: Metric;
};

export interface TokenUsageAdminContextType {
  summary: TokenUsageAdminSummaryInterface[];
  timeline: TokenUsageAdminTimelineInterface[];
  byCompany: TokenUsageAdminBreakdownInterface[];
  byUser: TokenUsageAdminBreakdownInterface[];
  /** Platform-side spend split by operation. Always empty in single-customer mode. */
  /** Platform spend by operation — empty in single-customer mode. */
  byOperation: TokenUsageAdminBreakdownInterface[];
  /** Customer spend by operation — the customer-side mirror of byOperation. */
  byCustomerOperation: TokenUsageAdminBreakdownInterface[];
  companies: { id: string; label: string }[];
  filters: TokenUsageAdminFilterState;
  /** Merges a partial patch into the current filters; every key is optional. */
  setFilters: (next: Partial<TokenUsageAdminFilterState>) => void;
  /** `true` once a company filter is applied — the platform panels are meaningless then. */
  singleCustomerMode: boolean;
  isLoading: boolean;
  error: string | null;
}

const TokenUsageAdminContext = createContext<TokenUsageAdminContextType | undefined>(undefined);

/** Current calendar month to now, which is the window the page opens on. */
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return { from: start.toISOString(), to: now.toISOString() };
}

type TokenUsageAdminProviderProps = {
  children: ReactNode;
  /** Pre-select a company, which puts the page in single-customer mode from the first render. */
  initialCompanyId?: string;
  /** ISO 8601 instant. Defaults to the start of the current month. */
  initialFrom?: string;
  /** ISO 8601 instant. Defaults to now. */
  initialTo?: string;
  /** Rows per ranked panel. Defaults to 10. */
  topN?: number;
};

/**
 * Owns every filter the administrative token-usage page reads, fetches the five
 * panels behind it, and publishes the filter bar into the page title bar.
 *
 * The filter bar is rendered into `title.functions` here — NOT in the container —
 * because `RoundPageContainer`'s title bar reads `title.functions` from
 * `SharedContext`, and a descendant cannot inject nodes into an ancestor's
 * provider value. That is why the filter state lives at this level.
 */
export const TokenUsageAdminProvider = ({
  children,
  initialCompanyId,
  initialFrom,
  initialTo,
  topN = DEFAULT_TOP_N,
}: TokenUsageAdminProviderProps) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const [filters, setFilterState] = useState<TokenUsageAdminFilterState>(() => {
    const range = defaultRange();
    return {
      from: initialFrom ?? range.from,
      to: initialTo ?? range.to,
      granularity: "day",
      stackBy: "scope",
      companyId: initialCompanyId,
      metric: "cost",
    };
  });

  const [summary, setSummary] = useState<TokenUsageAdminSummaryInterface[]>([]);
  const [timeline, setTimeline] = useState<TokenUsageAdminTimelineInterface[]>([]);
  const [byCompany, setByCompany] = useState<TokenUsageAdminBreakdownInterface[]>([]);
  const [byUser, setByUser] = useState<TokenUsageAdminBreakdownInterface[]>([]);
  const [byOperation, setByOperation] = useState<TokenUsageAdminBreakdownInterface[]>([]);
  const [byCustomerOperation, setByCustomerOperation] = useState<TokenUsageAdminBreakdownInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { from, to, granularity, stackBy, companyId, metric } = filters;
  const singleCustomerMode = Boolean(companyId);

  useEffect(() => {
    // `cancelled` is the out-of-order guard: a filter change fires a new request
    // while the previous one is still in flight, and without this flag the slower
    // (older) response would land last and overwrite the fresher state.
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    const base = { from, to, companyId };

    Promise.all([
      TokenUsageAdminService.getSummary(base),
      TokenUsageAdminService.getTimeline({ ...base, granularity, stackBy }),
      TokenUsageAdminService.getBreakdown({ ...base, dimension: "company", scope: "customer", limit: topN }),
      TokenUsageAdminService.getBreakdown({ ...base, dimension: "user", scope: "customer", limit: topN }),
      // Platform spend is, by definition, the usage with no owning company, so
      // filtering it by one is meaningless — the call is skipped entirely rather
      // than issued and discarded.
      companyId
        ? Promise.resolve<TokenUsageAdminBreakdownInterface[]>([])
        : TokenUsageAdminService.getBreakdown({ ...base, dimension: "operation", scope: "platform", limit: topN }),
      // Customer spend by operation — unlike the platform panel this one IS
      // meaningful under a company filter, so it is always requested.
      TokenUsageAdminService.getBreakdown({ ...base, dimension: "operation", scope: "customer", limit: topN }),
    ])
      .then(([nextSummary, nextTimeline, nextByCompany, nextByUser, nextByOperation, nextByCustomerOperation]) => {
        if (cancelled) return;
        setSummary(nextSummary ?? []);
        setTimeline(nextTimeline ?? []);
        setByCompany(nextByCompany ?? []);
        setByUser(nextByUser ?? []);
        setByOperation(nextByOperation ?? []);
        setByCustomerOperation(nextByCustomerOperation ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load administrative token usage:", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, granularity, stackBy, companyId, topN]);

  const setFilters = useCallback((next: Partial<TokenUsageAdminFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...next }));
  }, []);

  /**
   * Derived from the company breakdown, per the page design. Note the
   * consequence: once a company filter is applied the breakdown returns that
   * company alone, so the selector narrows to it — clearing the filter restores
   * the full list.
   */
  const companies = useMemo(
    () => byCompany.filter((row) => row.id !== "other").map((row) => ({ id: row.id, label: row.label })),
    [byCompany],
  );

  const breadcrumb = (): BreadcrumbItemData[] => [
    {
      name: t("token_usage.admin.title"),
      href: generateUrl({ page: TOKEN_USAGE_ADMIN_PAGE_URL }),
    },
  ];

  const title = () => ({
    type: t("token_usage.admin.title"),
    functions: (
      <TokenUsageAdminFilterBar
        key="tokenUsageAdminFilterBar"
        from={from}
        to={to}
        granularity={granularity}
        companyId={companyId}
        metric={metric}
        companies={companies}
        onChange={setFilters}
      />
    ),
  });

  const contextValue = useMemo<TokenUsageAdminContextType>(
    () => ({
      summary,
      timeline,
      byCompany,
      byUser,
      byOperation,
      byCustomerOperation,
      companies,
      filters,
      setFilters,
      singleCustomerMode,
      isLoading,
      error,
    }),
    [
      summary,
      timeline,
      byCompany,
      byUser,
      byOperation,
      byCustomerOperation,
      companies,
      filters,
      setFilters,
      singleCustomerMode,
      isLoading,
      error,
    ],
  );

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <TokenUsageAdminContext.Provider value={contextValue}>{children}</TokenUsageAdminContext.Provider>
    </SharedProvider>
  );
};

export const useTokenUsageAdmin = (): TokenUsageAdminContextType => {
  const ctx = useContext(TokenUsageAdminContext);
  if (!ctx) {
    throw new Error("useTokenUsageAdmin() called outside <TokenUsageAdminProvider>.");
  }
  return ctx;
};
