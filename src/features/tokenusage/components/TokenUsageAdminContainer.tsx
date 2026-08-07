"use client";

import { cn } from "../../../lib/utils";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RoundPageContainer } from "../../../components";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shadcnui";
import { useTokenUsageAdmin } from "../contexts/TokenUsageAdminContext";
import type { StackBy } from "../data/tokenusage-admin.types";
import { TokenUsageAdminTiles } from "./TokenUsageAdminTiles";
import { TokenUsageBreakdownTable } from "./TokenUsageBreakdownTable";
import { TokenUsageRankedBar } from "./TokenUsageRankedBar";
import { TokenUsageTimelineChart } from "./TokenUsageTimelineChart";

const STACK_BY_VALUES: StackBy[] = ["scope", "type", "company"];

/**
 * Page body for the administrative token-usage dashboard.
 *
 * Stateless by design — every value it renders comes from
 * `useTokenUsageAdmin()`. The filter bar is deliberately NOT here: it belongs to
 * the page title bar, which `RoundPageContainer` fills from `SharedContext`, so
 * the provider publishes it (see TokenUsageAdminContext).
 */
export function TokenUsageAdminContainer() {
  const t = useTranslations();
  const {
    summary,
    timeline,
    byCompany,
    byUser,
    byOperation,
    byCustomerOperation,
    filters,
    setFilters,
    singleCustomerMode,
    isLoading,
    error,
  } = useTokenUsageAdmin();

  const stackByItems = useMemo(
    () => ({
      scope: t("token_usage.admin.stack.scope"),
      type: t("token_usage.admin.stack.type"),
      company: t("token_usage.admin.stack.company"),
    }),
    [t],
  );

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

  const emptyLabel = t("token_usage.admin.no_data");

  return (
    <RoundPageContainer fullWidth forceHeader>
      <div className="flex w-full flex-col gap-4 p-4">
        <TokenUsageAdminTiles summary={summary} metric={filters.metric} singleCustomerMode={singleCustomerMode} />

        <Card>
          <CardHeader>
            <CardTitle>{t("token_usage.admin.usage_over_time")}</CardTitle>
            <CardAction>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">{t("token_usage.admin.stack_by")}</span>
                <Select
                  items={stackByItems}
                  value={filters.stackBy}
                  onValueChange={(value) => {
                    if (value) setFilters({ stackBy: value as StackBy });
                  }}
                >
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STACK_BY_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {stackByItems[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <TokenUsageTimelineChart rows={timeline} metric={filters.metric} stackBy={filters.stackBy} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("token_usage.admin.by_company")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TokenUsageRankedBar rows={byCompany} metric={filters.metric} emptyLabel={emptyLabel} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("token_usage.admin.by_user")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TokenUsageRankedBar rows={byUser} metric={filters.metric} emptyLabel={emptyLabel} />
            </CardContent>
          </Card>
        </div>

        {/* The two cost centres, broken down the same way so they can be read
            against each other. Operation types are vocabulary, not data — unlike
            the company and user panels above, these labels get translated.

            Platform spend has no owning company, so a company filter makes that
            half meaningless: the provider skips the request and the card is
            hidden rather than rendered empty, leaving the customer half full
            width. */}
        <div className={cn("grid gap-4", !singleCustomerMode && "md:grid-cols-2")}>
          <Card>
            <CardHeader>
              <CardTitle>{t("token_usage.admin.customer_by_operation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TokenUsageRankedBar
                rows={byCustomerOperation}
                metric={filters.metric}
                emptyLabel={emptyLabel}
                labelsAreOperationTypes
              />
            </CardContent>
          </Card>

          {!singleCustomerMode && (
            <Card>
              <CardHeader>
                <CardTitle>{t("token_usage.admin.platform_by_operation")}</CardTitle>
              </CardHeader>
              <CardContent>
                <TokenUsageRankedBar
                  rows={byOperation}
                  metric={filters.metric}
                  emptyLabel={emptyLabel}
                  labelsAreOperationTypes
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("token_usage.admin.detail")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TokenUsageBreakdownTable rows={byCompany} metric={filters.metric} />
          </CardContent>
        </Card>
      </div>
    </RoundPageContainer>
  );
}
