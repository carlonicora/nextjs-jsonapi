"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cellDate, cellId } from "../../../components";
import { Modules } from "../../../core";
import { TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../hooks";
import { getRoleId } from "../../../roles";
import { Link } from "../../../shadcnui";
import { UserInterface } from "../../user";
import { useCurrentUserContext } from "../../user/contexts";
import { useDateFormatter } from "../../../contexts/DateLocaleContext";
import { AdminSubscriptionStatusBadge } from "../../billing/admin-company/components/AdminSubscriptionStatusBadge";
import { CompanyFields, CompanyInterface } from "../data";

function SubscriptionNextDateCell({ date }: { date?: Date }) {
  const { format } = useDateFormatter();
  return (
    <span data-testid="company-subscription-next-date" className="text-muted-foreground text-xs">
      {date ? format(date, "dateMedium") : "—"}
    </span>
  );
}

export const useCompanyTableStructure: UseTableStructureHook<CompanyInterface, CompanyFields> = (params) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { hasRole } = useCurrentUserContext<UserInterface>();

  // Memoize tableData to prevent infinite re-renders
  const tableData = useMemo(() => {
    return params.data.map((company: CompanyInterface) => {
      const entry: TableContent<CompanyInterface> = {
        jsonApiData: company,
      };
      entry[CompanyFields.companyId] = company.id;
      params.fields.forEach((field) => {
        entry[field] = company[field as keyof CompanyInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<CompanyFields, () => any>> = {
    [CompanyFields.companyId]: () =>
      cellId({
        name: "companyId",
        checkedIds: params.checkedIds,
        toggleId: params.toggleId,
      }),
    [CompanyFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t(`user.fields.name.label`),
      cell: ({ row }: { row: Row<TableContent<CompanyInterface>> }) => {
        const company = row.original.jsonApiData as CompanyInterface;
        return (
          <Link
            href={
              hasRole(getRoleId().Administrator)
                ? generateUrl({
                    page: "/administration",
                    id: Modules.Company.pageUrl?.substring(1),
                    childPage: company.id,
                  })
                : generateUrl({ page: Modules.Company, id: company.id })
            }
          >
            {row.getValue("name")}
          </Link>
        );
      },
      enableSorting: true,
      enableHiding: false,
    }),
    [CompanyFields.createdAt]: () =>
      cellDate({
        name: "createdAt",
        title: t(`common.date.create`),
        sortable: true,
      }),
    [CompanyFields.subscriptionPlan]: () => ({
      id: "subscriptionPlan",
      accessorKey: "subscriptionPlan",
      header: t(`billing.ui.admin_company.columns.plan`),
      cell: ({ row }: { row: Row<TableContent<CompanyInterface>> }) => {
        const company = row.original.jsonApiData as CompanyInterface;
        const plan = company.subscriptionPlan;
        const label = !plan
          ? "—"
          : plan === "other"
            ? (company.subscriptionPlanName ?? "—")
            : t(`billing.ui.admin_company.plan.${plan}`);
        return <span data-testid="company-subscription-plan">{label}</span>;
      },
      enableHiding: false,
    }),
    [CompanyFields.subscriptionStatus]: () => ({
      id: "subscriptionStatus",
      accessorKey: "subscriptionStatus",
      header: t(`billing.ui.admin_company.columns.status`),
      cell: ({ row }: { row: Row<TableContent<CompanyInterface>> }) => {
        const company = row.original.jsonApiData as CompanyInterface;
        const state = company.subscriptionStatus;
        return (
          <span data-testid="company-subscription-status">
            {state ? <AdminSubscriptionStatusBadge state={state} /> : "—"}
          </span>
        );
      },
      enableHiding: false,
    }),
    [CompanyFields.subscriptionNextAt]: () => ({
      id: "subscriptionNextAt",
      accessorKey: "subscriptionNextAt",
      header: t(`billing.ui.admin_company.columns.next_date`),
      cell: ({ row }: { row: Row<TableContent<CompanyInterface>> }) => {
        const company = row.original.jsonApiData as CompanyInterface;
        return <SubscriptionNextDateCell date={company.subscriptionNextAt} />;
      },
      enableHiding: false,
    }),
  };

  // Memoize columns to prevent infinite re-renders
  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<CompanyInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl, hasRole]);

  // Memoize the return object to prevent infinite re-renders
  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};
