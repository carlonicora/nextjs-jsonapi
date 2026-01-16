"use client";
import "../../client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, memo, useMemo } from "react";
import { DataListRetriever, useTableGenerator } from "../../hooks";
import { ModuleWithPermissions } from "../../permissions";
import { Button, Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../../shadcnui";
import { ContentTableSearch } from "./ContentTableSearch";

const EMPTY_ARRAY: any[] = [];

export type GenerateTableStructureParams = {
  data: any[];
  toggleValueToFormIdsId: (id: string, name: string) => void;
  isSelected: (id: string) => boolean;
};

type ContentListTableProps = {
  title?: string;
  data: DataListRetriever<any>;
  tableGenerator?: never;
  tableGeneratorType: ModuleWithPermissions;
  fields: any[];
  checkedIds?: string[];
  toggleId?: (id: string) => void;
  functions?: ReactNode;
  filters?: ReactNode;
  allowSearch?: boolean;
  context?: Record<string, any>;
};

export const ContentListTable = memo(function ContentListTable(props: ContentListTableProps) {
  const { data, fields, checkedIds, toggleId, allowSearch, filters } = props;

  const { data: tableData, columns: tableColumns } = useTableGenerator(props.tableGeneratorType, {
    data: data?.data ?? EMPTY_ARRAY,
    fields: fields,
    checkedIds: checkedIds,
    toggleId: toggleId,
    dataRetriever: data,
    context: props.context,
  });

  const columnVisibility = useMemo(
    () =>
      fields.reduce(
        (acc, columnId) => {
          acc[columnId] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    [fields],
  );

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnVisibility,
    },
  });

  // if (!data.isLoaded || !data.data) {
  //   return <ContentListTableLoader />;
  // }

  const rowModel = tableData ? table.getRowModel() : null;
  const showFooter = !!(props.functions || data.next || data.previous);

  return (
    <div className="flex w-full flex-col">
      <div className="overflow-clip rounded-md border">
        <Table>
          <TableHeader className="bg-muted font-semibold">
            {props.title && (
              <TableRow>
                <TableHead className="bg-card text-primary p-4 text-left font-bold" colSpan={tableColumns.length}>
                  <div className="flex w-full items-center justify-between gap-x-2">
                    <div className="w-full">{props.title}</div>
                    {(props.functions || props.filters || allowSearch) && (
                      <>
                        {props.functions}
                        {props.filters}
                        <ContentTableSearch data={data} />
                      </>
                    )}
                  </div>
                </TableHead>
              </TableRow>
            )}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rowModel && rowModel.rows?.length ? (
              rowModel.rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {showFooter && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="bg-card py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        data.previous?.(true);
                      }}
                      disabled={!data.previous}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {data.pageInfo && (
                      <span className="text-muted-foreground text-xs">
                        {`${data.pageInfo.startItem}-${data.pageInfo.endItem}${data.total ? ` of ${data.total}` : ""}`}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        data.next?.(true);
                      }}
                      disabled={!data.next}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
});
