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
import { CompanyFields, CompanyInterface } from "../data";

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
      header: t(`foundations.user.fields.name.label`),
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
      enableSorting: false,
      enableHiding: false,
    }),
    [CompanyFields.createdAt]: () =>
      cellDate({
        name: "createdAt",
        title: t(`generic.date.create`),
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
