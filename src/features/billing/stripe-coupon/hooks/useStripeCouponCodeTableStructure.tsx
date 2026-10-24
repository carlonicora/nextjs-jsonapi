"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge } from "../../../../shadcnui";
import { registerTableGenerator, TableContent, UseTableStructureHook } from "../../../../hooks";
import { formatDate, useBillingFormatOptions } from "../../components/utils";
import { useCouponContext } from "../../contexts/CouponContext";
import { CouponCodeActions } from "../components/widgets/CouponCodeActions";
import { StripeCouponCodeFields } from "../data/stripe-coupon-code.fields";
import { StripeCouponCodeInterface } from "../data/stripe-coupon-code.interface";
import { StripeCouponInterface } from "../data/stripe-coupon.interface";
import { couponPlacesLeft } from "../utils/coupon-places";

export type CouponCodeStatus = "active" | "inactive" | "expired" | "used_up";

/**
 * Expired and used-up codes are dead for good (Stripe never revives them), so
 * they win over a plain inactive flag. Places follow the same rule as the
 * backend: the smaller of the code's and the coupon's remaining limits.
 */
export function couponCodeStatus(code: StripeCouponCodeInterface, coupon?: StripeCouponInterface): CouponCodeStatus {
  if (code.expiresAt && code.expiresAt.getTime() <= Date.now()) return "expired";
  const left = couponPlacesLeft(code, coupon ?? { maxRedemptions: undefined, timesRedeemed: 0 });
  if (left === 0) return "used_up";
  return code.active ? "active" : "inactive";
}

const STATUS_VARIANT: Record<CouponCodeStatus, "softGreen" | "softGray" | "softAmber" | "softRed"> = {
  active: "softGreen",
  inactive: "softGray",
  expired: "softAmber",
  used_up: "softRed",
};

export const useStripeCouponCodeTableStructure: UseTableStructureHook<
  StripeCouponCodeInterface,
  StripeCouponCodeFields
> = (params) => {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  // The codes list is mounted on the coupon's own page, so the coupon whose
  // limits share the places is the context's, not whatever the code includes.
  const { coupon } = useCouponContext();

  const tableData = useMemo(() => {
    return params.data.map((code: StripeCouponCodeInterface) => {
      const entry: TableContent<StripeCouponCodeInterface> = { jsonApiData: code };
      params.fields.forEach((field) => {
        entry[field] = (code as any)[field as keyof StripeCouponCodeInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<StripeCouponCodeFields, () => any>> = {
    [StripeCouponCodeFields.code]: () => ({
      id: "code",
      accessorKey: "code",
      header: t("billing.admin.coupons.fields.code"),
      cell: ({ row }: { row: TableContent<StripeCouponCodeInterface> }) => {
        const code: StripeCouponCodeInterface = row.original.jsonApiData;
        return <span className="text-xs font-medium">{code.code}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponCodeFields.places]: () => ({
      id: "places",
      accessorKey: "places",
      header: t("billing.admin.coupons.fields.places"),
      cell: ({ row }: { row: TableContent<StripeCouponCodeInterface> }) => {
        const code: StripeCouponCodeInterface = row.original.jsonApiData;
        // Typography role 15 (numeric): tabular-nums, end-aligned.
        return (
          <span className="block text-xs tabular-nums text-end">
            {code.maxRedemptions !== undefined
              ? t("billing.admin.coupons.places.limited", {
                  used: String(code.timesRedeemed),
                  limit: String(code.maxRedemptions),
                })
              : t("billing.admin.coupons.places.unlimited", { used: String(code.timesRedeemed) })}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponCodeFields.expiresAt]: () => ({
      id: "expiresAt",
      accessorKey: "expiresAt",
      header: t("billing.admin.coupons.fields.expiresAt"),
      cell: ({ row }: { row: TableContent<StripeCouponCodeInterface> }) => {
        const code: StripeCouponCodeInterface = row.original.jsonApiData;
        return (
          <span className="text-xs tabular-nums">
            {code.expiresAt ? formatDate(code.expiresAt, fmt) : t("billing.admin.coupons.codes.never")}
          </span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponCodeFields.automatic]: () => ({
      id: "automatic",
      accessorKey: "automatic",
      header: t("billing.admin.coupons.fields.automatic"),
      cell: ({ row }: { row: TableContent<StripeCouponCodeInterface> }) => {
        const code: StripeCouponCodeInterface = row.original.jsonApiData;
        return code.automatic ? (
          <Badge variant="softBlue">{t("billing.admin.coupons.codes.automatic")}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponCodeFields.status]: () => ({
      id: "status",
      accessorKey: "status",
      header: t("billing.admin.coupons.fields.status"),
      cell: ({ row }: { row: TableContent<StripeCouponCodeInterface> }) => {
        const code: StripeCouponCodeInterface = row.original.jsonApiData;
        const status = couponCodeStatus(code, code.coupon ?? coupon);
        return <Badge variant={STATUS_VARIANT[status]}>{t(`billing.admin.coupons.codes.status.${status}`)}</Badge>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [StripeCouponCodeFields.actions]: () => ({
      id: "actions",
      accessorKey: "actions",
      header: "",
      cell: ({ row }: { row: TableContent<StripeCouponCodeInterface> }) => {
        const code: StripeCouponCodeInterface = row.original.jsonApiData;
        return <CouponCodeActions code={code} status={couponCodeStatus(code, code.coupon ?? coupon)} />;
      },
      enableSorting: false,
      enableHiding: false,
    }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<StripeCouponCodeInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, coupon]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("stripe-coupon-codes", useStripeCouponCodeTableStructure);
