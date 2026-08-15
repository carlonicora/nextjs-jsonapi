"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Modules } from "../../../../core";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../../hooks";
import { Badge, Link } from "../../../../shadcnui";
import { formatCurrency, formatInterval } from "../../components/utils/currency";
import { StripePriceFields } from "../data/stripe-price.fields";
import { StripePriceInterface } from "../data/stripe-price.interface";

export const useStripePriceTableStructure: UseTableStructureHook<StripePriceInterface, StripePriceFields> = (
  params,
) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

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
        // Typography role 15 (numeric): tabular-nums, right-aligned. NEVER font-mono.
        return (
          <span className="block text-xs tabular-nums text-right">
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
        return <span className="block text-xs tabular-nums text-right">{price.token ?? ""}</span>;
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
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<StripePriceInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("stripe-prices", useStripePriceTableStructure);
