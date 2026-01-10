"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cellDate, cellId, UserAvatar } from "../../../components";
import { Modules } from "../../../core";
import { TableContent, UseTableStructureHook } from "../../../hooks/types";
import { usePageUrlGenerator } from "../../../hooks/usePageUrlGenerator";
import { Link } from "../../../shadcnui";
import { cn } from "../../../utils";
import { UserFields, UserInterface } from "../data";

export const useUserTableStructure: UseTableStructureHook<UserInterface, UserFields> = (params) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  // Memoize tableData to prevent infinite re-renders
  const tableData = useMemo(() => {
    return params.data.map((user: UserInterface) => {
      const entry: TableContent<UserInterface> = {
        jsonApiData: user,
      };
      entry[UserFields.userId] = user.id;
      params.fields.forEach((field) => {
        entry[field] = user[field as keyof UserInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<UserFields, () => any>> = {
    [UserFields.userId]: () =>
      cellId({
        name: "userId",
        checkedIds: params.checkedIds,
        toggleId: params.toggleId,
      }),
    [UserFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t(`user.fields.name.label`),
      cell: ({ row }: { row: Row<TableContent<UserInterface>> }) => {
        const user = row.original.jsonApiData as UserInterface;
        return (
          <Link
            href={generateUrl({ page: Modules.User, id: user.id })}
            className={cn(
              `flex items-center justify-start gap-2`,
              user.isDeleted || !user.isActivated ? "text-muted-foreground italic" : "",
            )}
          >
            <UserAvatar user={user} />
            {user.name}
            {user.isDeleted ? ` - ${t("user.errors.deleted")}` : ""}
            {!user.isActivated ? ` - ${t("user.errors.inactive")}` : ""}
          </Link>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [UserFields.email]: () => ({
      id: "email",
      accessorKey: "email",
      header: t(`common.fields.email.label`),
      cell: ({ row }: { row: Row<TableContent<UserInterface>> }) => <>{row.getValue("email")}</>,
      enableSorting: false,
      enableHiding: false,
    }),
    [UserFields.relevance]: () => ({
      id: "relevance",
      accessorKey: "relevance",
      header: t(`common.relevance`),
      cell: ({ row }: { row: TableContent<UserInterface> }) => {
        const user: UserInterface = row.original.jsonApiData;

        if (!user.relevance) return <></>;

        const response = `${user.relevance.toFixed(0)}%`;

        return (
          <div className="relative flex h-5 w-20 items-center justify-center overflow-hidden rounded border text-center">
            <div
              className={`bg-accent absolute top-0 left-0 h-full opacity-${Math.round(user.relevance)}`}
              style={{ width: `${user.relevance}%` }}
            ></div>
            <span
              className={`relative text-xs ${user.relevance < 40 ? "text-muted-foreground" : "text-accent-foreground font-semibold"}`}
            >
              {response}
            </span>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [UserFields.createdAt]: () =>
      cellDate({
        name: "createdAt",
        title: t(`common.date.create`),
      }),
  };

  // Memoize columns to prevent infinite re-renders
  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<UserInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  // Memoize the return object to prevent infinite re-renders
  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};
