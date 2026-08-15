"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../components";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shadcnui";
import { cn } from "../../../utils";
import { useTokenUsageReport } from "../contexts/TokenUsageReportContext";
import { TokenUsageRankedBar } from "./TokenUsageRankedBar";
import { TokenUsageReportTiles, type TokenUsageBalances } from "./TokenUsageReportTiles";
import { TokenUsageTimelineChart } from "./TokenUsageTimelineChart";

type Props = {
  /**
   * The caller's own credit balances. Supplied by the host app, which reads them
   * from its CurrentUserContext — the package has no access to that context.
   */
  balances?: TokenUsageBalances | null;
};

/**
 * Page body for the self-service token-usage dashboard.
 *
 * Stateless by design — every value comes from useTokenUsageReport(). The filter
 * bar is deliberately NOT here: it belongs to the page title bar, which
 * RoundPageContainer fills from SharedContext, so the provider publishes it.
 *
 * The timeline and the ranked bars are the PACKAGE'S EXISTING components, used
 * verbatim. They take the same six metric getters the report interfaces were
 * given, which is what makes that reuse possible.
 */
export function TokenUsageReportContainer({ balances = null }: Props) {
  const t = useTranslations();
  const { summary, timeline, byOperation, byTarget, isLoading, error, targetPanelTitleKey } = useTokenUsageReport();

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

  const emptyLabel = t("token_usage.report.no_data");
  // The panel needs both a title the host app owns and rows to put under it.
  const targetTitle = targetPanelTitleKey && byTarget.length > 0 ? t(targetPanelTitleKey) : undefined;

  return (
    <RoundPageContainer fullWidth forceHeader>
      <div className="flex w-full flex-col gap-4 p-4">
        <TokenUsageReportTiles summary={summary} metric="credits" balances={balances} />

        <Card>
          <CardHeader>
            <CardTitle>{t("token_usage.report.usage_over_time")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TokenUsageTimelineChart rows={timeline} metric="credits" stackBy="type" />
          </CardContent>
        </Card>

        <div className={cn("grid gap-4", targetTitle && "md:grid-cols-2")}>
          <Card>
            <CardHeader>
              <CardTitle>{t("token_usage.report.by_operation")}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Operation types are vocabulary the host app translates, unlike
                  the target panel's rows, which carry entity NAMES. */}
              <TokenUsageRankedBar
                rows={byOperation}
                metric="credits"
                emptyLabel={emptyLabel}
                labelsAreOperationTypes
              />
            </CardContent>
          </Card>

          {targetTitle && (
            <Card>
              <CardHeader>
                <CardTitle>{targetTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <TokenUsageRankedBar rows={byTarget} metric="credits" emptyLabel={emptyLabel} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RoundPageContainer>
  );
}
