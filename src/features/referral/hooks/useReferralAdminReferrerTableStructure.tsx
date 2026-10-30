"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cellDate } from "../../../components/tables/cells/cell.date";
import { registerTableGenerator, TableContent, UseTableStructureHook } from "../../../hooks";
import { Button } from "../../../shadcnui";
import { showError, showToast } from "../../../utils";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import { ReferralAdminReferrerInterface, ReferralAdminSort } from "../interfaces/referral-admin.interface";

/**
 * Columns of the referrers ranking. The values double as the TanStack column
 * ids: ContentListTable builds its `columnVisibility` from the `fields` array,
 * so a column whose id differs from its field is invisible.
 */
export enum ReferralAdminReferrerFields {
  rank = "rank",
  referrer = "referrer",
  visits = "visits",
  invites = "invites",
  signups = "signups",
  paying = "paying",
  conversion = "conversion",
  credits = "credits",
  lastInvite = "lastInvite",
}

/** What the container passes through ContentListTable's `context`: the active sort and its setter. */
export type ReferralAdminReferrerTableContext = {
  sort: ReferralAdminSort;
  onSort: (sort: ReferralAdminSort) => void;
};

/**
 * Copies text to the clipboard from inside a click handler, with the toast on
 * success and the error toast on refusal (a denied permission or an insecure
 * context). Shared by the per-row button and the container's "Copy all emails".
 */
export async function copyReferrerEmails(
  text: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showToast(t("referral.admin.referrers.copied"));
  } catch {
    showError(t("referral.admin.referrers.copyFailed"));
  }
}

const NUMERIC = { className: "text-end" };

export const useReferralAdminReferrerTableStructure: UseTableStructureHook<
  ReferralAdminReferrerInterface,
  ReferralAdminReferrerFields
> = (params) => {
  const t = useTranslations();
  const { decimal } = useUsageFormatters();
  const context = params.context as ReferralAdminReferrerTableContext | undefined;

  const tableData = useMemo(() => {
    return params.data.map((entry: ReferralAdminReferrerInterface, index: number) => {
      const row: TableContent<ReferralAdminReferrerInterface> = { jsonApiData: entry };
      row[ReferralAdminReferrerFields.rank] = index + 1;
      // cellDate reads the value from the row by the column name.
      row[ReferralAdminReferrerFields.lastInvite] = entry.lastInviteAt;
      return row;
    });
  }, [params.data]);

  /** Header of a sortable column: a button that sets the sort the API reads (D8). */
  const sortableHeader = (sort: ReferralAdminSort, label: string) => () => {
    const active = context?.sort === sort;
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className={active ? "text-primary" : "text-muted-foreground"}
        title={t("referral.admin.referrers.sortBy")}
        aria-sort={active ? "descending" : undefined}
        data-testid={active ? "referrals-referrers-sort" : undefined}
        onClick={() => context?.onSort(sort)}
      >
        {label}
      </Button>
    );
  };

  // Typography role 15 (numeric): tabular-nums, end-aligned.
  const numericCell = (read: (entry: ReferralAdminReferrerInterface) => number) => {
    return ({ row }: { row: { original: TableContent<ReferralAdminReferrerInterface> } }) => (
      <span className="block text-xs tabular-nums text-end">{decimal(read(row.original.jsonApiData), 0)}</span>
    );
  };

  const fieldColumnMap: Record<ReferralAdminReferrerFields, () => any> = {
    [ReferralAdminReferrerFields.rank]: () => ({
      id: ReferralAdminReferrerFields.rank,
      header: "#",
      cell: ({ row }: { row: { original: TableContent<ReferralAdminReferrerInterface> } }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {row.original[ReferralAdminReferrerFields.rank]}
        </span>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferrerFields.referrer]: () => ({
      id: ReferralAdminReferrerFields.referrer,
      header: t("referral.admin.referrers.columns.referrer"),
      cell: ({ row }: { row: { original: TableContent<ReferralAdminReferrerInterface> } }) => {
        const entry = row.original.jsonApiData;
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-sm">{entry.name}</span>
              <span className="text-muted-foreground text-xs">{entry.email}</span>
            </div>
            {entry.email && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={t("referral.admin.referrers.copyEmail")}
                title={t("referral.admin.referrers.copyEmail")}
                data-testid={`referrals-copy-email-${entry.id}`}
                onClick={() => copyReferrerEmails(entry.email, t)}
              >
                <CopyIcon />
              </Button>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferrerFields.visits]: () => ({
      id: ReferralAdminReferrerFields.visits,
      header: t("referral.admin.referrers.columns.visits"),
      cell: numericCell((entry) => entry.visits),
      meta: NUMERIC,
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferrerFields.invites]: () => ({
      id: ReferralAdminReferrerFields.invites,
      header: sortableHeader("invites", t("referral.admin.referrers.columns.invites")),
      cell: numericCell((entry) => entry.invitesSent),
      meta: NUMERIC,
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferrerFields.signups]: () => ({
      id: ReferralAdminReferrerFields.signups,
      header: sortableHeader("signups", t("referral.admin.referrers.columns.signups")),
      cell: ({ row }: { row: { original: TableContent<ReferralAdminReferrerInterface> } }) => {
        const entry = row.original.jsonApiData;
        return (
          <div className="flex flex-col items-end">
            <span className="text-xs tabular-nums">{decimal(entry.signupsLink + entry.signupsDirect, 0)}</span>
            <span className="text-muted-foreground text-xs">
              {t("referral.admin.referrers.split", { link: entry.signupsLink, direct: entry.signupsDirect })}
            </span>
          </div>
        );
      },
      meta: NUMERIC,
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferrerFields.paying]: () => ({
      id: ReferralAdminReferrerFields.paying,
      header: sortableHeader("paying", t("referral.admin.referrers.columns.paying")),
      cell: numericCell((entry) => entry.paying),
      meta: NUMERIC,
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferrerFields.conversion]: () => ({
      id: ReferralAdminReferrerFields.conversion,
      header: sortableHeader("conversion", t("referral.admin.referrers.columns.conversion")),
      cell: ({ row }: { row: { original: TableContent<ReferralAdminReferrerInterface> } }) => {
        const entry = row.original.jsonApiData;
        // Conversion = paying / emails sent; a referrer who sent none has no rate.
        if (!entry.invitesSent) return <span className="block text-muted-foreground text-xs text-end">—</span>;
        const rate = Math.round((entry.paying / entry.invitesSent) * 100);
        return (
          <span className="flex items-center justify-end gap-1.5">
            <span className="bg-primary/15 relative h-1.5 w-12 overflow-hidden rounded-full">
              <span className="bg-primary absolute inset-y-0 start-0" style={{ width: `${Math.min(rate, 100)}%` }} />
            </span>
            <span className="text-xs tabular-nums">{`${decimal(rate, 0)}%`}</span>
          </span>
        );
      },
      meta: NUMERIC,
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferrerFields.credits]: () => ({
      id: ReferralAdminReferrerFields.credits,
      header: sortableHeader("credits", t("referral.admin.referrers.columns.credits")),
      cell: numericCell((entry) => entry.creditsEarned),
      meta: NUMERIC,
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferrerFields.lastInvite]: () =>
      cellDate({
        name: ReferralAdminReferrerFields.lastInvite,
        title: t("referral.admin.referrers.columns.lastInvite"),
      }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<ReferralAdminReferrerInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, decimal, context?.sort]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("referrals/administration/referrers", useReferralAdminReferrerTableStructure);
