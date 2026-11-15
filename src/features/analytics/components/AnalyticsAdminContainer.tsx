"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../components";
import { Modules } from "../../../core";
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shadcnui";
import { useAnalyticsAdmin } from "../contexts/AnalyticsAdminContext";
import { ANALYTICS_AUDIENCES, type AnalyticsAudience } from "../data/analytics.types";
import { AnalyticsAdminTiles } from "./AnalyticsAdminTiles";
import { AnalyticsBreakdownTable } from "./AnalyticsBreakdownTable";
import { AnalyticsPageListCard } from "./AnalyticsPageListCard";
import { AnalyticsSessionsTable } from "./AnalyticsSessionsTable";
import { AnalyticsTimelineChart } from "./AnalyticsTimelineChart";

/**
 * Page body for the administrative analytics dashboard: two tabs, Site visitors
 * and App users, each with its own panels.
 *
 * Stateless by design — every value it renders comes from
 * `useAnalyticsAdmin()`, which holds the selected audience and fetches only that
 * tab's panels. The filter bar is deliberately NOT here: it belongs to the page
 * title bar, which `RoundPageContainer` fills from `SharedContext`, so the
 * provider publishes it (see AnalyticsAdminContext).
 */
export function AnalyticsAdminContainer() {
  const t = useTranslations();
  const { filters, setFilters, isLoading, error } = useAnalyticsAdmin();

  return (
    <RoundPageContainer module={Modules.AnalyticsSummary} fullWidth forceHeader>
      <div className="flex w-full flex-col gap-4 p-4">
        <Tabs
          value={filters.audience}
          onValueChange={(value) => {
            const next = ANALYTICS_AUDIENCES.find((audience) => audience === value);
            if (next) setFilters({ audience: next });
          }}
        >
          <TabsList data-testid="analytics-audience-tabs">
            {ANALYTICS_AUDIENCES.map((audience) => (
              <TabsTrigger key={audience} value={audience} data-testid={`analytics-tab-${audience}`}>
                {t(`analytics.admin.tabs.${audience}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {ANALYTICS_AUDIENCES.map((audience) => (
            <TabsContent key={audience} value={audience} data-testid={`analytics-panel-${audience}`}>
              {audience === filters.audience &&
                (error ? (
                  <Card>
                    <CardContent>
                      <p className="text-destructive text-xs/relaxed">{error}</p>
                    </CardContent>
                  </Card>
                ) : // Loading renders nothing in the panel: the title bar and the tabs
                // are already mounted, so a spinner would only make the controls jump.
                isLoading ? null : (
                  <AudiencePanels audience={audience} />
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </RoundPageContainer>
  );
}

function AudiencePanels({ audience }: { audience: AnalyticsAudience }) {
  const t = useTranslations();
  const { summary, timeline, breakdowns, sessions, loadMoreSessions, hasMoreSessions, sessionPageUrl } =
    useAnalyticsAdmin();

  const currentSessions = summary.find((row) => row.section === "total" && row.window === "current")?.sessions ?? 0;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <AnalyticsAdminTiles summary={summary} audience={audience} />
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
          <AnalyticsTimelineChart rows={timeline} firstSeriesLabel={t(`analytics.admin.series.${audience}`)} />
        </CardContent>
      </Card>

      {audience === "visitors" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <AnalyticsPageListCard
              variant="top-pages"
              title={t("analytics.admin.panels.top_pages")}
              rows={breakdowns.route}
            />
            <AnalyticsPageListCard
              variant="entry-pages"
              title={t("analytics.admin.panels.entry_pages")}
              rows={breakdowns.landing}
            />
            <AnalyticsPageListCard
              variant="exit-pages"
              title={t("analytics.admin.panels.exit_pages")}
              rows={breakdowns.exit}
              totalSessions={currentSessions}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.admin.panels.breakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsBreakdownTable breakdowns={breakdowns} />
            </CardContent>
          </Card>
        </>
      ) : (
        <AnalyticsPageListCard
          variant="most-used-pages"
          title={t("analytics.admin.panels.most_used_pages")}
          rows={breakdowns.route}
        />
      )}

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
  );
}
