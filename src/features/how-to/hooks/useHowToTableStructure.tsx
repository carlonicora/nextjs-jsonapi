"use client";

import { HowToFields } from "@/features/essentials/how-to/data/HowToFields";
import { HowToInterface } from "@/features/essentials/how-to/data/HowToInterface";
import { cellDate, cellId, ContributorsList } from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { ContentInterface } from "@carlonicora/nextjs-jsonapi/core";
import {
  registerTableGenerator,
  TableContent,
  usePageUrlGenerator,
  UseTableStructureHook,
} from "@carlonicora/nextjs-jsonapi/client";
import { Link, Tooltip, TooltipContent, TooltipTrigger } from "@carlonicora/nextjs-jsonapi/components";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

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
      header: t(`features.howTo.fields.name.label`),
      cell: ({ row }: { row: TableContent<HowToInterface> }) => {
        const howTo: HowToInterface = row.original.jsonApiData;
        return (
          <Tooltip>
            <TooltipTrigger>
              <Link href={generateUrl({ page: Modules.HowTo, id: howTo.id })}>{howTo.name}</Link>
            </TooltipTrigger>
            <TooltipContent>{howTo.tldr}</TooltipContent>
          </Tooltip>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [HowToFields.authors]: () => ({
      id: "authors",
      accessorKey: "authors",
      header: t(`generic.relationships.author.label`),
      cell: ({ row }: { row: TableContent<ContentInterface> }) => {
        const content: ContentInterface = row.original.jsonApiData;
        return <ContributorsList content={content} />;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [HowToFields.description]: () => ({
      id: "description",
      accessorKey: "description",
      header: t(`features.howTo.fields.description.label`),
      cell: ({ row }: { row: TableContent<HowToInterface> }) => {
        const howTo: HowToInterface = row.original.jsonApiData;
        return <span>{howTo.description}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [HowToFields.pages]: () => ({
      id: "pages",
      accessorKey: "pages",
      header: t(`features.howTo.fields.pages.label`),
      cell: ({ row }: { row: TableContent<HowToInterface> }) => {
        const howTo: HowToInterface = row.original.jsonApiData;
        return <span>{howTo.pages}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [HowToFields.aiStatus]: () => ({
      id: "aiStatus",
      accessorKey: "aiStatus",
      header: t(`features.howTo.fields.aiStatus.label`),
      cell: ({ row }: { row: TableContent<HowToInterface> }) => {
        const howTo: HowToInterface = row.original.jsonApiData;
        return <span>{howTo.aiStatus}</span>;
      },
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

registerTableGenerator(Modules.HowTo, useHowToTableStructure);
