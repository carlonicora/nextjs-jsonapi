"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { usePageUrlGenerator } from "../../../hooks";
import { Badge, Button, Link, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shadcnui";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import type { AnalyticsSessionInterface } from "../data/analytics-session.interface";

type Props = {
  rows: AnalyticsSessionInterface[];
  /** Base route of the journey page; each row links to `${sessionPageUrl}/${id}`. */
  sessionPageUrl: string;
  onLoadMore: () => void;
  hasMore: boolean;
};

/** How many trailing characters of the visitor id identify an anonymous visitor. */
const VISITOR_SUFFIX_LENGTH = 6;

/**
 * The sessions in the selected window, newest first as the backend returns them.
 *
 * Paginated by cursor: the owning context holds the next-page reference and
 * appends on `onLoadMore`, so this table stays stateless. A session linked to a
 * signed-in user shows the user; any other shows a short visitor suffix, enough
 * to tell two anonymous visitors apart without displaying the whole id.
 */
export function AnalyticsSessionsTable({ rows, sessionPageUrl, onLoadMore, hasMore }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const generateUrl = usePageUrlGenerator();
  const { decimal } = useUsageFormatters();

  const dateTime = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }), [locale]);

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("analytics.admin.no_data")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* The package's <Table> wraps itself in an `overflow-x-clip` container,
          which would swallow the overflow before this scroller ever saw it —
          hence the child override. Wide tables must scroll, never widen the page. */}
      <div className="overflow-x-auto [&_[data-slot=table-container]]:overflow-x-visible">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-medium">{t("analytics.admin.columns.started")}</TableHead>
              <TableHead className="text-xs font-medium">{t("analytics.admin.columns.visitor")}</TableHead>
              <TableHead className="text-xs font-medium">{t("analytics.admin.columns.source")}</TableHead>
              <TableHead className="text-xs font-medium">{t("analytics.admin.columns.landing")}</TableHead>
              <TableHead className="text-end text-xs font-medium">{t("analytics.admin.columns.pages")}</TableHead>
              <TableHead className="text-xs font-medium">{t("analytics.admin.columns.device")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const source = [row.utmSource ?? row.referrerHost, row.utmMedium].filter(Boolean).join(" / ");

              return (
                <TableRow key={row.id} data-testid={`analytics-session-row-${row.id}`}>
                  <TableCell className="text-xs tabular-nums">
                    <Link
                      href={generateUrl({ page: sessionPageUrl, id: row.id })}
                      data-testid={`analytics-session-link-${row.id}`}
                    >
                      {dateTime.format(row.startedAt)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.user ? (
                      <span className="flex flex-col">
                        <span>{row.user.name}</span>
                        <span className="text-muted-foreground text-xs">{row.user.email}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Badge variant="softGray">{t("analytics.admin.anonymous")}</Badge>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {row.visitorId.slice(-VISITOR_SUFFIX_LENGTH)}
                        </span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{source}</TableCell>
                  <TableCell className="text-xs">{row.landingRoute}</TableCell>
                  <TableCell className="text-end text-xs tabular-nums">{decimal(row.pageViews, 0)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{row.deviceType}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={onLoadMore}>
            {t("analytics.admin.load_more")}
          </Button>
        </div>
      )}
    </div>
  );
}
