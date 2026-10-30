"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cellDate } from "../../../components/tables/cells/cell.date";
import { registerTableGenerator, TableContent, UseTableStructureHook } from "../../../hooks";
import { Badge } from "../../../shadcnui";
import { useUsageFormatters } from "../../tokenusage/lib/formatters";
import { ReferralAdminReferralInterface } from "../interfaces/referral-admin.interface";

/**
 * Columns of "Every referral". The values double as the TanStack column ids:
 * ContentListTable builds its `columnVisibility` from the `fields` array.
 */
export enum ReferralAdminReferralFields {
  account = "account",
  referrer = "referrer",
  source = "source",
  date = "date",
  status = "status",
  credits = "credits",
}

type Row = { row: { original: TableContent<ReferralAdminReferralInterface> } };

export const useReferralAdminReferralTableStructure: UseTableStructureHook<
  ReferralAdminReferralInterface,
  ReferralAdminReferralFields
> = (params) => {
  const t = useTranslations();
  const { decimal } = useUsageFormatters();

  const tableData = useMemo(() => {
    return params.data.map((entry: ReferralAdminReferralInterface) => {
      const row: TableContent<ReferralAdminReferralInterface> = { jsonApiData: entry };
      // cellDate reads the value from the row by the column name.
      row[ReferralAdminReferralFields.date] = entry.referredAt;
      return row;
    });
  }, [params.data]);

  const fieldColumnMap: Record<ReferralAdminReferralFields, () => any> = {
    [ReferralAdminReferralFields.account]: () => ({
      id: ReferralAdminReferralFields.account,
      header: t("referral.admin.referrals.columns.account"),
      cell: ({ row }: Row) => {
        const entry = row.original.jsonApiData;
        return (
          <div className="flex flex-col">
            <span className="text-sm">{entry.name}</span>
            <span className="text-muted-foreground text-xs">{entry.email}</span>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferralFields.referrer]: () => ({
      id: ReferralAdminReferralFields.referrer,
      header: t("referral.admin.referrals.columns.referrer"),
      cell: ({ row }: Row) => {
        const entry = row.original.jsonApiData;
        return (
          <div className="flex flex-col">
            <span className="text-sm">{entry.referrerName}</span>
            <span className="text-muted-foreground text-xs">{entry.referrerEmail}</span>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferralFields.source]: () => ({
      id: ReferralAdminReferralFields.source,
      header: t("referral.admin.referrals.columns.source"),
      cell: ({ row }: Row) => {
        const source = row.original.jsonApiData.source;
        if (source === "link") return <Badge variant="softBlue">{t("referral.admin.source.link")}</Badge>;
        if (source === "direct") return <Badge variant="softGray">{t("referral.admin.source.direct")}</Badge>;
        // A referral written before the source was recorded: unknown, not guessed.
        return <span className="text-muted-foreground text-xs">—</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferralFields.date]: () =>
      cellDate({ name: ReferralAdminReferralFields.date, title: t("referral.admin.referrals.columns.date") }),
    [ReferralAdminReferralFields.status]: () => ({
      id: ReferralAdminReferralFields.status,
      header: t("referral.admin.referrals.columns.status"),
      cell: ({ row }: Row) =>
        row.original.jsonApiData.status === "completed" ? (
          <Badge variant="softGreen">{t("referral.admin.status.completed")}</Badge>
        ) : (
          <Badge variant="softYellow">{t("referral.admin.status.pending")}</Badge>
        ),
      enableSorting: false,
      enableHiding: false,
    }),
    [ReferralAdminReferralFields.credits]: () => ({
      id: ReferralAdminReferralFields.credits,
      header: t("referral.admin.referrals.columns.credits"),
      cell: ({ row }: Row) => {
        const entry = row.original.jsonApiData;
        // Both sides receive the same award: shown as "200 + 200", as in the approved mock.
        if (entry.status !== "completed" || !entry.tokensAwarded)
          return <span className="block text-muted-foreground text-xs text-end">—</span>;
        const award = decimal(entry.tokensAwarded, 0);
        return <span className="block text-xs tabular-nums text-end">{`${award} + ${award}`}</span>;
      },
      meta: { className: "text-end" },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<ReferralAdminReferralInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, decimal]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("referrals/administration/referrals", useReferralAdminReferralTableStructure);
