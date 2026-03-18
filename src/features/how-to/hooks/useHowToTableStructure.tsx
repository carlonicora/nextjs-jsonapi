"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { cellDate, cellId } from "../../../components";
import { Modules } from "../../../core";
import { registerTableGenerator, TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../hooks";
import { Link } from "../../../shadcnui";
import { HowToFields } from "../data/HowToFields";
import { HowToInterface } from "../data/HowToInterface";

export const useHowToTableStructure: UseTableStructureHook<HowToInterface, HowToFields> = (params) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const tableData = useMemo(() => {
    return params.data.map((howTo: HowToInterface) => {
      const entry: TableContent<HowToInterface> = {
        jsonApiData: howTo,
      };
      entry[HowToFields.howToId] = howTo.id;
      params.fields.forEach((field) => {
        entry[field] = howTo[field as keyof HowToInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<HowToFields, () => any>> = {
    [HowToFields.howToId]: () =>
      cellId({
        name: "howToId",
        checkedIds: params.checkedIds,
        toggleId: params.toggleId,
      }),
    [HowToFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t(`howto.fields.name.label`),
      cell: ({ row }: { row: TableContent<HowToInterface> }) => {
        const howTo: HowToInterface = row.original.jsonApiData;
        return <Link href={generateUrl({ page: Modules.HowTo, id: howTo.id })}>{howTo.name}</Link>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [HowToFields.description]: () => ({
      id: "description",
      accessorKey: "description",
      header: t(`howto.fields.description.label`),
      cell: ({ row }: { row: TableContent<HowToInterface> }) => <>{row.getValue("description")}</>,
      enableSorting: false,
      enableHiding: false,
    }),
    [HowToFields.pages]: () => ({
      id: "pages",
      accessorKey: "pages",
      header: t(`howto.fields.pages.label`),
      cell: ({ row }: { row: TableContent<HowToInterface> }) => <>{row.getValue("pages")}</>,
      enableSorting: false,
      enableHiding: false,
    }),
    [HowToFields.createdAt]: () =>
      cellDate({
        name: "createdAt",
        title: t(`common.date.create`),
      }),
    [HowToFields.updatedAt]: () =>
      cellDate({
        name: "updatedAt",
        title: t(`common.date.update`),
      }),
  };

  const columns = useMemo(() => {
    return params.fields.map((field) => fieldColumnMap[field]?.()).filter((col) => col !== undefined) as ColumnDef<
      TableContent<HowToInterface>
    >[];
  }, [params.fields, fieldColumnMap, t, generateUrl]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};

registerTableGenerator("howtos", useHowToTableStructure);
