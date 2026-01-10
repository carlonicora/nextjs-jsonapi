"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cellDate, cellId } from "../../../components";
import { Modules } from "../../../core";
import { TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../hooks";
import { Link } from "../../../shadcnui";
import { RoleFields, RoleInterface } from "../data";

export const useRoleTableStructure: UseTableStructureHook<RoleInterface, RoleFields> = (params) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  // Memoize tableData to prevent infinite re-renders
  const tableData = useMemo(() => {
    return params.data.map((role: RoleInterface) => {
      const entry: TableContent<RoleInterface> = {
        jsonApiData: role,
      };
      entry[RoleFields.roleId] = role.id;
      params.fields.forEach((field) => {
        entry[field] = role[field as keyof RoleInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<RoleFields, () => any>> = {
    [RoleFields.roleId]: () =>
      cellId({
        name: "roleId",
        checkedIds: params.checkedIds,
        toggleId: params.toggleId,
      }),
    [RoleFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t(`role.fields.name.label`),
      cell: ({ row }: { row: Row<TableContent<RoleInterface>> }) => {
        const role = row.original.jsonApiData as RoleInterface;
        return <Link href={generateUrl({ page: Modules.Role, id: role.id })}>{row.getValue("name")}</Link>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [RoleFields.description]: () => ({
      id: "description",
      accessorKey: "description",
      header: t(`role.fields.description.label`),
      cell: ({ row }: { row: Row<TableContent<RoleInterface>> }) => <>{row.getValue("description")}</>,
      enableSorting: false,
      enableHiding: false,
    }),
    [RoleFields.createdAt]: () =>
      cellDate({
        name: "createdAt",
        title: t(`common.date.create`),
      }),
  };

  // Memoize columns to prevent infinite re-renders
  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<RoleInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  // Memoize the return object to prevent infinite re-renders
  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};
