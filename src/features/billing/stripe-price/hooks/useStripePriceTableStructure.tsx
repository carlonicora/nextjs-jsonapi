"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CopyIcon, DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Modules } from "../../../../core";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../../hooks";
import { Badge, Button, Link } from "../../../../shadcnui";
import { formatCurrency, formatInterval } from "../../components/utils/currency";
import { StripePriceFields } from "../data/stripe-price.fields";
import { StripePriceInterface } from "../data/stripe-price.interface";

/**
 * Row-level handlers the ACTIONS column calls. They reach this hook through
 * `ContentListTable`'s `context` prop, which the table forwards verbatim as
 * `params.context` (ContentListTable.tsx:88-95, hooks/types.ts:27) — the table
 * generator registry hands the hook nothing else from the call site.
 *
 * Both are optional on purpose: the same generator serves lists that render the
 * actions column without wiring anything (or that omit the column entirely), so
 * each button is rendered only when its handler is actually present rather than
 * rendering a dead control.
 */
type StripePriceRowActions = {
  onClone?: (price: StripePriceInterface) => void;
  onExport?: (price: StripePriceInterface) => void;
};

export const useStripePriceTableStructure: UseTableStructureHook<StripePriceInterface, StripePriceFields> = (
  params,
) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const onClone = params.context?.onClone as StripePriceRowActions["onClone"];
  const onExport = params.context?.onExport as StripePriceRowActions["onExport"];

  const tableData = useMemo(() => {
    return params.data.map((price: StripePriceInterface) => {
      const entry: TableContent<StripePriceInterface> = { jsonApiData: price };
      entry[StripePriceFields.stripePriceId] = price.id;
      params.fields.forEach((field) => {
        entry[field] = (price as any)[field as keyof StripePriceInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<StripePriceFields, () => any>> = {
    [StripePriceFields.nickname]: () => ({
      id: "nickname",
      accessorKey: "nickname",
      header: t("billing.admin.prices.fields.nickname"),
      cell: ({ row }: { row: TableContent<StripePriceInterface> }) => {
        const price: StripePriceInterface = row.original.jsonApiData;
        return (
          <Link href={generateUrl({ page: Modules.StripePrice, id: price.id })}>
            {price.nickname ?? formatCurrency(price.unitAmount, price.currency)}
          </Link>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripePriceFields.amount]: () => ({
      id: "amount",
      accessorKey: "amount",
      header: t("billing.admin.prices.fields.amount"),
      cell: ({ row }: { row: TableContent<StripePriceInterface> }) => {
        const price: StripePriceInterface = row.original.jsonApiData;
        // Typography role 15 (numeric): tabular-nums, end-aligned. NEVER font-mono.
        return (
          <span className="block text-xs tabular-nums text-end">
            {formatCurrency(price.unitAmount, price.currency)}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripePriceFields.interval]: () => ({
      id: "interval",
      accessorKey: "interval",
      header: t("billing.admin.prices.fields.billing"),
      cell: ({ row }: { row: TableContent<StripePriceInterface> }) => {
        const price: StripePriceInterface = row.original.jsonApiData;
        // Typography role 8 (UI chrome): single-line, plain text-xs.
        return <span className="text-xs">{formatInterval(price)}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripePriceFields.token]: () => ({
      id: "token",
      accessorKey: "token",
      header: t("billing.admin.prices.fields.token"),
      cell: ({ row }: { row: TableContent<StripePriceInterface> }) => {
        const price: StripePriceInterface = row.original.jsonApiData;
        return <span className="block text-xs tabular-nums text-end">{price.token ?? ""}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripePriceFields.status]: () => ({
      id: "status",
      accessorKey: "status",
      header: t("billing.admin.prices.fields.status"),
      cell: ({ row }: { row: TableContent<StripePriceInterface> }) => {
        const price: StripePriceInterface = row.original.jsonApiData;
        return (
          <span className="flex flex-wrap items-center gap-1">
            {price.active ? (
              <Badge variant="softGreen">{t("billing.admin.prices.status.active")}</Badge>
            ) : (
              <Badge variant="softGray">{t("billing.admin.prices.status.archived")}</Badge>
            )}
            {price.isTrial && <Badge variant="softBlue">{t("billing.admin.prices.badge.trial")}</Badge>}
            {price.recurring?.usageType === "metered" && (
              <Badge variant="softBlue">{t("billing.admin.prices.badge.metered")}</Badge>
            )}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripePriceFields.actions]: () => ({
      id: "actions",
      accessorKey: "actions",
      header: t("billing.admin.prices.fields.actions"),
      cell: ({ row }: { row: TableContent<StripePriceInterface> }) => {
        const price: StripePriceInterface = row.original.jsonApiData;
        return (
          <span className="flex items-center justify-end gap-x-1">
            {onClone && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("billing.admin.prices.actions.clone")}
                onClick={(event) => {
                  // The row itself can be clickable (ContentListTable's
                  // `onRowClick`), so a row action must never bubble into it.
                  event.stopPropagation();
                  onClone(price);
                }}
              >
                <CopyIcon />
              </Button>
            )}
            {onExport && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("billing.admin.prices.actions.export")}
                onClick={(event) => {
                  event.stopPropagation();
                  onExport(price);
                }}
              >
                <DownloadIcon />
              </Button>
            )}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<StripePriceInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl, onClone, onExport]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("stripe-prices", useStripePriceTableStructure);
