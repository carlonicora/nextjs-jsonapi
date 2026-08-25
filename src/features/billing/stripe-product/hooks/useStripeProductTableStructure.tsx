"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge, Link } from "../../../../shadcnui";
import { Modules } from "../../../../core";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../../hooks";
import { StripeProductFields } from "../data/stripe-product.fields";
import { StripeProductInterface } from "../data/stripe-product.interface";

export const useStripeProductTableStructure: UseTableStructureHook<StripeProductInterface, StripeProductFields> = (
  params,
) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const tableData = useMemo(() => {
    return params.data.map((product: StripeProductInterface) => {
      const entry: TableContent<StripeProductInterface> = { jsonApiData: product };
      entry[StripeProductFields.stripeProductId] = product.id;
      params.fields.forEach((field) => {
        entry[field] = (product as any)[field as keyof StripeProductInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<StripeProductFields, () => any>> = {
    [StripeProductFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t("billing.admin.products.fields.name"),
      cell: ({ row }: { row: TableContent<StripeProductInterface> }) => {
        const product: StripeProductInterface = row.original.jsonApiData;
        return <Link href={generateUrl({ page: Modules.StripeProduct, id: product.id })}>{product.name}</Link>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeProductFields.status]: () => ({
      id: "status",
      accessorKey: "status",
      header: t("billing.admin.products.fields.status"),
      cell: ({ row }: { row: TableContent<StripeProductInterface> }) => {
        const product: StripeProductInterface = row.original.jsonApiData;
        return product.active ? (
          <Badge variant="softGreen">{t("billing.admin.products.status.active")}</Badge>
        ) : (
          <Badge variant="softGray">{t("billing.admin.products.status.archived")}</Badge>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeProductFields.prices]: () => ({
      id: "prices",
      accessorKey: "prices",
      header: t("billing.admin.products.fields.prices"),
      cell: ({ row }: { row: TableContent<StripeProductInterface> }) => {
        const product: StripeProductInterface = row.original.jsonApiData;
        // Typography role 15 (numeric): tabular-nums, end-aligned. NEVER
        // font-mono — no monospace font is loaded in these apps.
        return <span className="block text-xs tabular-nums text-end">{product.stripePrices.length}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<StripeProductInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("stripe-products", useStripeProductTableStructure);
