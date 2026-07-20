"use client";
import "../../client";

import { ExpandedState, flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from "@tanstack/react-table";

import { cn } from "@/index";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { ReactNode, memo, useMemo, useState } from "react";
import { DataListRetriever, TableContent, useTableGenerator } from "../../hooks";
import { ModuleWithPermissions } from "../../permissions";
import { Button, Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../../shadcnui";
import { MicroLabel } from "../typography";
import { ContentTableSearch } from "./ContentTableSearch";

const EMPTY_ARRAY: any[] = [];

function getGroupKeys(item: TableContent<any>, field: string): string[] {
  const value = item.jsonApiData[field];
  if (Array.isArray(value)) {
    return value.filter((v: any) => v && typeof v === "object" && "name" in v).map((v: any) => v.name ?? String(v.id));
  }
  if (value && typeof value === "object" && "name" in value) {
    return [value.name ?? String(value.id)];
  }
  return [String(value ?? "")];
}

export type GenerateTableStructureParams = {
  data: any[];
  toggleValueToFormIdsId: (id: string, name: string) => void;
  isSelected: (id: string) => boolean;
};

type ContentListTableProps = {
  title?: string;
  titleActions?: ReactNode;
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
  expandable?: boolean;
  getSubRows?: (row: any) => any[];
  defaultExpanded?: boolean | ExpandedState;
  fullWidth?: boolean;
  groupBy?: string;
  groupLabel?: (key: string) => ReactNode;
  groupOrder?: string[];
  hideHeader?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (rowData: any) => void;
};

export const ContentListTable = memo(function ContentListTable(props: ContentListTableProps) {
  const { data, fields, checkedIds, toggleId, allowSearch, filters: _filters, fullWidth, onRowClick } = props;
  const t = useTranslations();
  const [expanded, setExpanded] = useState<ExpandedState>(
    props.defaultExpanded === true ? true : typeof props.defaultExpanded === "object" ? props.defaultExpanded : {},
  );

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
    ...(props.expandable && {
      getExpandedRowModel: getExpandedRowModel(),
      getSubRows: props.getSubRows,
      onExpandedChange: setExpanded,
      state: { expanded },
    }),
    initialState: {
      columnVisibility,
    },
  });

  // if (!data.isLoaded || !data.data) {
  //   return <ContentListTableLoader />;
  // }

  const rowModel = tableData ? table.getRowModel() : null;

  const groupedRows = useMemo(() => {
    if (!props.groupBy || !rowModel?.rows?.length) return null;

    const groupMap = new Map<string, typeof rowModel.rows>();
    for (const row of rowModel.rows) {
      const keys = getGroupKeys(row.original, props.groupBy!);
      for (const key of keys) {
        let list = groupMap.get(key);
        if (!list) {
          list = [];
          groupMap.set(key, list);
        }
        list.push(row);
      }
    }

    const order = props.groupOrder;
    const sortedKeys = [...groupMap.keys()].sort((a, b) => {
      if (order) {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        // keys absent from groupOrder sort last, alphabetically among themselves
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });
    return sortedKeys.map((groupKey) => ({
      groupKey,
      rows: groupMap.get(groupKey)!,
    }));
  }, [props.groupBy, props.groupOrder, rowModel]);

  const showFooter = !!(data.next || data.previous);

  return (
    <div className="flex w-full flex-col">
      {/* <div className="overflow-clip rounded-md border"> */}
      <div className={cn(`overflow-clip`, fullWidth ? `` : `rounded-md border`)}>
        <Table>
          <TableHeader className="bg-muted font-semibold">
            {props.title && (
              <TableRow>
                <TableHead
                  className="bg-card rounded-t-lg text-primary p-4 text-left font-bold"
                  colSpan={tableColumns.length}
                >
                  <div className="flex w-full items-center justify-between gap-x-2">
                    {/* <div className="w-full">{fullWidth ? `` : props.title}</div> */}
                    <div className="w-full">
                      <div
                        className={cn(
                          "text-muted-foreground flex items-center gap-x-2  font-light whitespace-nowrap",
                          fullWidth ? `text-lg` : `text-sm`,
                        )}
                      >
                        {props.titleActions}
                        {props.tableGeneratorType.icon && (
                          <props.tableGeneratorType.icon
                            className={cn(`text-primary`, fullWidth ? `h-6 w-6` : `h-4 w-4`)}
                          />
                        )}
                        {props.title}
                      </div>
                    </div>
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
            {!props.hideHeader &&
              table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as { className?: string } | undefined;
                    return (
                      <TableHead key={header.id} className={meta?.className}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
          </TableHeader>
          <TableBody>
            {rowModel && rowModel.rows?.length ? (
              groupedRows ? (
                groupedRows.map((group) => (
                  <React.Fragment key={group.groupKey}>
                    <TableRow>
                      <TableCell colSpan={tableColumns.length} className="bg-muted px-4 py-2">
                        <MicroLabel>{props.groupLabel?.(group.groupKey) ?? group.groupKey}</MicroLabel>
                      </TableCell>
                    </TableRow>
                    {group.rows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={() => onRowClick?.(row.original.jsonApiData)}
                        className={`group ${onRowClick ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                          return (
                            <TableCell key={cell.id} className={meta?.className}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                rowModel.rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick?.(row.original.jsonApiData)}
                    className={`group ${onRowClick ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                      return (
                        <TableCell key={cell.id} className={meta?.className}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  {props.emptyState ??
                    (t.has("ui.empty_states.no_results") ? t("ui.empty_states.no_results") : "No results.")}
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
