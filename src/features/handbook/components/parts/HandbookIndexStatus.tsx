"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import { HandbookPageInterface } from "../../data/HandbookPageInterface";

type HandbookIndexStatusProps = {
  pages: HandbookPageInterface[];
};

/**
 * `aiStatus` values written by the ingest. Only `failed` means the page is not
 * answerable; `pending` and `in_progress` are a sync still running and say
 * nothing about the index being wrong.
 */
const FAILURE_STATUSES = new Set(["failed", "error"]);

/**
 * The one line of index bookkeeping the reading surface keeps.
 *
 * Word counts and per-page AI badges left the contents page; how many pages
 * there are and when they were last synced did not, because that is the one
 * question the administrator who pressed Sincronizza actually has. Both values
 * are derived from the loaded pages — nothing new is stored for either, and
 * `updatedAt` is framework-managed.
 */
export function HandbookIndexStatus({ pages }: HandbookIndexStatusProps) {
  const t = useTranslations();
  const format = useFormatter();

  const lastSynced = useMemo(() => {
    let latest: Date | undefined = undefined;

    for (const page of pages) {
      const updatedAt = page.updatedAt;
      if (!(updatedAt instanceof Date) || Number.isNaN(updatedAt.getTime())) continue;
      if (!latest || updatedAt.getTime() > latest.getTime()) latest = updatedAt;
    }

    return latest;
  }, [pages]);

  const failures = useMemo(
    () => pages.filter((page) => FAILURE_STATUSES.has((page.aiStatus ?? "").toLowerCase())).length,
    [pages],
  );

  return (
    <span className="text-muted-foreground text-xs tabular-nums">
      {t("handbook.contents.status", {
        count: pages.length,
        date: lastSynced ? format.dateTime(lastSynced, { dateStyle: "medium" }) : "",
      })}
      {failures > 0 ? (
        <span className="text-destructive ms-2 tabular-nums">
          {t("handbook.contents.failures", { count: failures })}
        </span>
      ) : null}
    </span>
  );
}
