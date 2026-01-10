"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cellDate, cellId, ContributorsList } from "../../../components";
import { Modules } from "../../../core";
import { TableContent, usePageUrlGenerator, UseTableStructureHook } from "../../../hooks";
import { Link, Tooltip, TooltipContent, TooltipTrigger } from "../../../shadcnui";
import { getIconByModule } from "../../../utils";
import { ContentFields, ContentInterface } from "../data";

export const useContentTableStructure = <U extends string = ContentFields>(
  params: Parameters<UseTableStructureHook<ContentInterface, U>>[0],
): ReturnType<UseTableStructureHook<ContentInterface, U>> => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const tableData = useMemo(() => {
    return params.data.map((content: ContentInterface) => {
      const entry: TableContent<ContentInterface> = {
        jsonApiData: content,
      };
      entry[ContentFields.contentId] = content.id;
      params.fields.forEach((field) => {
        entry[field as string] = content[field as keyof ContentInterface];
      });
      return entry;
    });
  }, [params.data, params.fields]);

  const fieldColumnMap: Partial<Record<string, () => any>> = {
    [ContentFields.contentId]: () =>
      cellId({
        name: "contentId",
        checkedIds: params.checkedIds,
        toggleId: params.toggleId,
      }),
    [ContentFields.name]: () => ({
      id: "name",
      accessorKey: "name",
      header: t(`content.fields.name.label`),
      cell: ({ row }: { row: TableContent<ContentInterface> }) => {
        const content: ContentInterface = row.original.jsonApiData;

        const contentModule = content.contentType ? Modules.findByModelName(content.contentType) : undefined;
        const link = contentModule ? generateUrl({ page: contentModule, id: content.id }) : "#";

        return (
          <Tooltip>
            <TooltipTrigger className="flex items-center justify-start space-x-2">
              <>
                {contentModule && getIconByModule({ module: contentModule, className: "h-4 w-4" })}
                <Link href={link}>{content.name}</Link>
              </>
            </TooltipTrigger>
            <TooltipContent>{content.tldr}</TooltipContent>
          </Tooltip>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [ContentFields.relevance]: () => ({
      id: "relevance",
      accessorKey: "relevance",
      header: t(`common.relevance`),
      cell: ({ row }: { row: TableContent<ContentInterface> }) => {
        const content: ContentInterface = row.original.jsonApiData;

        if (!content.relevance) return <></>;

        const response = `${content.relevance.toFixed(0)}%`;

        return (
          <div className="relative flex h-5 w-20 items-center justify-center overflow-hidden rounded border text-center">
            <div
              className={`bg-accent absolute top-0 left-0 h-full opacity-${Math.round(content.relevance)}`}
              style={{ width: `${content.relevance}%` }}
            ></div>
            <span
              className={`relative text-xs ${content.relevance < 40 ? "text-muted-foreground" : "text-accent-foreground font-semibold"}`}
            >
              {response}
            </span>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [ContentFields.authors]: () => ({
      id: "authors",
      accessorKey: "authors",
      header: t(`common.relationships.author.label`),
      cell: ({ row }: { row: TableContent<ContentInterface> }) => {
        const content: ContentInterface = row.original.jsonApiData;
        return <ContributorsList content={content} />;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [ContentFields.createdAt]: () =>
      cellDate({
        name: "createdAt",
        title: t(`common.date.create`),
      }),
    [ContentFields.updatedAt]: () =>
      cellDate({
        name: "updatedAt",
        title: t(`common.date.update`),
      }),
  };

  const columns = useMemo(() => {
    return params.fields
      .map((field) => {
        // First check local fieldColumnMap
        const localHandler = fieldColumnMap[field];
        if (localHandler) return localHandler();

        // Fallback to customCells from context
        const customHandler = params.context?.customCells?.[field];
        if (customHandler) return customHandler({ t });

        return undefined;
      })
      .filter((col) => col !== undefined) as ColumnDef<TableContent<ContentInterface>>[];
  }, [params.fields, fieldColumnMap, t, generateUrl, params.context?.customCells]);

  return useMemo(() => ({ data: tableData, columns: columns }), [tableData, columns]);
};
