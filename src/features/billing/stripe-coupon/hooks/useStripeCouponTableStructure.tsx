"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge, Link } from "../../../../shadcnui";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../../hooks";
import { useBillingFormatOptions } from "../../components/utils";
import { StripeCouponFields } from "../data/stripe-coupon.fields";
import { STRIPE_COUPON_DETAIL_PAGE_URL } from "../stripe-coupon.module";
import { StripeCouponInterface } from "../data/stripe-coupon.interface";
import { formatCouponDiscount } from "../utils/format-coupon-discount";

export const useStripeCouponTableStructure: UseTableStructureHook<StripeCouponInterface, StripeCouponFields> = (
  params,
) => {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const generateUrl = usePageUrlGenerator();

  const tableData = useMemo(() => {
    return params.data.map((coupon: StripeCouponInterface) => {
      const entry: TableContent<StripeCouponInterface> = { jsonApiData: coupon };
      params.fields.forEach((field) => {
        entry[field] = (coupon as any)[field as keyof StripeCouponInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<StripeCouponFields, () => any>> = {
    [StripeCouponFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t("billing.admin.coupons.fields.name"),
      cell: ({ row }: { row: TableContent<StripeCouponInterface> }) => {
        const coupon: StripeCouponInterface = row.original.jsonApiData;
        return <Link href={generateUrl({ page: STRIPE_COUPON_DETAIL_PAGE_URL, id: coupon.id })}>{coupon.name}</Link>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponFields.discount]: () => ({
      id: "discount",
      accessorKey: "discount",
      header: t("billing.admin.coupons.fields.discount"),
      cell: ({ row }: { row: TableContent<StripeCouponInterface> }) => {
        const coupon: StripeCouponInterface = row.original.jsonApiData;
        return <span className="text-xs">{formatCouponDiscount(coupon, t, fmt)}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponFields.places]: () => ({
      id: "places",
      accessorKey: "places",
      header: t("billing.admin.coupons.fields.places"),
      cell: ({ row }: { row: TableContent<StripeCouponInterface> }) => {
        const coupon: StripeCouponInterface = row.original.jsonApiData;
        // Typography role 15 (numeric): tabular-nums, end-aligned. NEVER
        // font-mono — no monospace font is loaded in these apps.
        return (
          <span className="block text-xs tabular-nums text-end">
            {coupon.maxRedemptions !== undefined
              ? t("billing.admin.coupons.places.limited", {
                  used: String(coupon.timesRedeemed),
                  limit: String(coupon.maxRedemptions),
                })
              : t("billing.admin.coupons.places.unlimited", { used: String(coupon.timesRedeemed) })}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponFields.codes]: () => ({
      id: "codes",
      accessorKey: "codes",
      header: t("billing.admin.coupons.fields.codes"),
      cell: ({ row }: { row: TableContent<StripeCouponInterface> }) => {
        const coupon: StripeCouponInterface = row.original.jsonApiData;
        return <span className="block text-xs tabular-nums text-end">{coupon.codes.length}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponFields.status]: () => ({
      id: "status",
      accessorKey: "status",
      header: t("billing.admin.coupons.fields.status"),
      cell: ({ row }: { row: TableContent<StripeCouponInterface> }) => {
        const coupon: StripeCouponInterface = row.original.jsonApiData;
        return coupon.valid ? (
          <Badge variant="softGreen">{t("billing.admin.coupons.status.active")}</Badge>
        ) : (
          <Badge variant="softGray">{t("billing.admin.coupons.status.ended")}</Badge>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<StripeCouponInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("stripe-coupons", useStripeCouponTableStructure);
