"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { DetailField, RoundPageContainer } from "../../../components";
import { SharedProvider } from "../../../contexts";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shadcnui";
import type { AnalyticsPageViewInterface } from "../data/analytics-page-view.interface";
import type { AnalyticsSessionInterface } from "../data/analytics-session.interface";
import { AnalyticsAdminService } from "../data/AnalyticsAdminService";
import { AnalyticsSessionsTable } from "./AnalyticsSessionsTable";

/** Default route of the dashboard the breadcrumb links back to. */
const ANALYTICS_ADMIN_PAGE_URL = "/administration/analytics";

/**
 * How far back the visitor's other sessions are looked up: the 13-month raw
 * retention, which sits inside the API's 400-day maximum range.
 */
const OTHER_SESSIONS_WINDOW_DAYS = 395;

type Props = {
  sessionId: string;
  /** Route of the dashboard; the journey pages live under `${pageUrl}/sessions`. */
  pageUrl?: string;
};

/**
 * One session, followed page by page.
 *
 * The attribution header says where the visitor came from, the page-view table
 * replays the session in order with the time spent before each step, and the
 * visitor's other sessions close the page. Unlike the dashboard this page has no
 * filters, so it fetches on mount without a provider and publishes its own
 * breadcrumb back to the dashboard.
 */
export function AnalyticsJourneyContainer({ sessionId, pageUrl = ANALYTICS_ADMIN_PAGE_URL }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const generateUrl = usePageUrlGenerator();

  const [session, setSession] = useState<AnalyticsSessionInterface | undefined>(undefined);
  const [pageViews, setPageViews] = useState<AnalyticsPageViewInterface[]>([]);
  const [otherSessions, setOtherSessions] = useState<AnalyticsSessionInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Out-of-order guard, as in AnalyticsAdminContext: a new sessionId must not
    // be overwritten by the slower response for the previous one.
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    Promise.all([
      AnalyticsAdminService.getSession({ id: sessionId }),
      AnalyticsAdminService.getSessionPageViews({ sessionId }),
    ])
      .then(async ([nextSession, nextPageViews]) => {
        if (cancelled) return;
        setSession(nextSession);
        setPageViews(nextPageViews ?? []);

        const to = new Date();
        const from = new Date(to.getTime() - OTHER_SESSIONS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const visitorSessions = await AnalyticsAdminService.getSessions({
          from: from.toISOString(),
          to: to.toISOString(),
          section: "all",
          visitorId: nextSession.visitorId,
        });
        if (cancelled) return;
        setOtherSessions((visitorSessions ?? []).filter((other) => other.id !== sessionId));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load the analytics journey:", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const dateTime = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" }),
    [locale],
  );

  /** Time since the previous page view, in the largest whole unit that fits. */
  const formatGap = (milliseconds: number): string => {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    if (seconds < 60) return unit(locale, "second", seconds);
    if (seconds < 3600) return unit(locale, "minute", Math.round(seconds / 60));
    return unit(locale, "hour", Math.round(seconds / 3600));
  };

  const breadcrumb: BreadcrumbItemData[] = [
    { name: t("analytics.admin.title"), href: generateUrl({ page: pageUrl }) },
    { name: t("analytics.admin.panels.journey") },
  ];

  const title = { type: t("analytics.admin.panels.journey") };

  const renderBody = () => {
    if (error) {
      return (
        <RoundPageContainer fullWidth forceHeader>
          <div className="p-4">
            <Card>
              <CardContent>
                <p className="text-destructive text-xs/relaxed">{error}</p>
              </CardContent>
            </Card>
          </div>
        </RoundPageContainer>
      );
    }

    // Loading renders nothing in the body, as on the dashboard.
    if (isLoading || !session) return <RoundPageContainer fullWidth forceHeader />;

    const source = [session.utmSource ?? session.referrerHost, session.utmMedium, session.utmCampaign]
      .filter(Boolean)
      .join(" / ");

    return (
      <RoundPageContainer fullWidth forceHeader>
        <div className="flex w-full flex-col gap-4 p-4">
          <Card data-testid="analytics-journey-attribution">
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {session.user ? (
                  <span className="flex flex-col">
                    <span className="text-sm">{session.user.name}</span>
                    <span className="text-muted-foreground text-xs">{session.user.email}</span>
                  </span>
                ) : (
                  <Badge variant="softGray">{t("analytics.admin.anonymous")}</Badge>
                )}
                {session.consented ? (
                  <Badge variant="softGreen">{t("analytics.admin.consented")}</Badge>
                ) : (
                  <Badge variant="softGray">{t("analytics.admin.not_consented")}</Badge>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailField label={t("analytics.admin.columns.started")} value={dateTime.format(session.startedAt)} />
                <DetailField label={t("analytics.admin.columns.source")} value={source} />
                <DetailField label={t("analytics.admin.columns.landing")} value={session.landingRoute} />
                <DetailField label={t("analytics.admin.columns.device")} value={session.deviceType} />
                <DetailField
                  label={t("analytics.admin.columns.visitor")}
                  value={<span className="tabular-nums">{session.visitorId}</span>}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.admin.columns.pages")}</CardTitle>
            </CardHeader>
            <CardContent>
              {pageViews.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("analytics.admin.no_data")}</p>
              ) : (
                // The package's <Table> wraps itself in an `overflow-x-clip`
                // container — hence the child override, so wide rows scroll.
                <div className="overflow-x-auto [&_[data-slot=table-container]]:overflow-x-visible">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-medium">{t("analytics.admin.columns.time")}</TableHead>
                        <TableHead className="text-end text-xs font-medium">
                          {t("analytics.admin.columns.gap")}
                        </TableHead>
                        <TableHead className="text-xs font-medium">{t("analytics.admin.columns.path")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageViews.map((pageView, index) => {
                        const previous = index > 0 ? pageViews[index - 1] : undefined;
                        return (
                          <TableRow key={pageView.id} data-testid={`analytics-pageview-row-${pageView.id}`}>
                            <TableCell className="text-xs tabular-nums">
                              {dateTime.format(pageView.createdAt)}
                            </TableCell>
                            <TableCell className="text-end text-xs tabular-nums">
                              {previous ? formatGap(pageView.createdAt.getTime() - previous.createdAt.getTime()) : "—"}
                            </TableCell>
                            <TableCell className="text-xs">{pageView.path}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.admin.panels.other_sessions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsSessionsTable
                rows={otherSessions}
                sessionPageUrl={`${pageUrl}/sessions`}
                onLoadMore={() => undefined}
                hasMore={false}
              />
            </CardContent>
          </Card>
        </div>
      </RoundPageContainer>
    );
  };

  return <SharedProvider value={{ breadcrumbs: breadcrumb, title }}>{renderBody()}</SharedProvider>;
}

function unit(locale: string, name: "second" | "minute" | "hour", value: number): string {
  return new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "short" }).format(value);
}
