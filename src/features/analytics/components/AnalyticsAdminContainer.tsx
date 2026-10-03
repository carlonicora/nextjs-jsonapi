"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../components";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shadcnui";
import { useAnalyticsAdmin } from "../contexts/AnalyticsAdminContext";
import { AnalyticsAdminTiles } from "./AnalyticsAdminTiles";
import { AnalyticsBreakdownTable } from "./AnalyticsBreakdownTable";
import { AnalyticsSessionsTable } from "./AnalyticsSessionsTable";
import { AnalyticsTimelineChart } from "./AnalyticsTimelineChart";

/**
 * Page body for the administrative analytics dashboard.
 *
 * Stateless by design — every value it renders comes from
 * `useAnalyticsAdmin()`. The filter bar is deliberately NOT here: it belongs to
 * the page title bar, which `RoundPageContainer` fills from `SharedContext`, so
 * the provider publishes it (see AnalyticsAdminContext).
 */
export function AnalyticsAdminContainer() {
  const t = useTranslations();
  const {
    summary,
    timeline,
    breakdowns,
    sessions,
    loadMoreSessions,
    hasMoreSessions,
    sessionPageUrl,
    isLoading,
    error,
  } = useAnalyticsAdmin();

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

  // Loading renders nothing in the body: the title bar (with the filter bar) is
  // already mounted, so a spinner would only make the controls jump on arrival.
  if (isLoading) return <RoundPageContainer fullWidth forceHeader />;

  return (
    <RoundPageContainer fullWidth forceHeader>
      <div className="flex w-full flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <AnalyticsAdminTiles summary={summary} />
          {/* Days past the raw-event retention are served from daily summaries.
              Whether the window reaches them is the backend's knowledge, not the
              client's, so the caption is always shown. */}
          <p className="text-muted-foreground text-xs">{t("analytics.admin.tiles.summarised_note")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.admin.panels.over_time")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsTimelineChart rows={timeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.admin.panels.breakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsBreakdownTable breakdowns={breakdowns} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.admin.panels.sessions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsSessionsTable
              rows={sessions}
              sessionPageUrl={sessionPageUrl}
              onLoadMore={loadMoreSessions}
              hasMore={hasMoreSessions}
            />
          </CardContent>
        </Card>
      </div>
    </RoundPageContainer>
  );
}
