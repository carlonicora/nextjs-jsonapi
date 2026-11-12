"use client";
import "../../client";

import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  SortingState,
  TableState,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/index";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { ReactNode, memo, useMemo, useState } from "react";
import { DataListRetriever, TableContent, useListSortParam, useTableGenerator } from "../../hooks";
import { ModuleWithPermissions } from "../../permissions";
import { Button, Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../../shadcnui";
import { useIsMobile } from "../../utils/use-mobile";
import { MicroLabel } from "../typography";
import { ContentTableSearch } from "./ContentTableSearch";
import { SortableHeader } from "./SortableHeader";
import { nextSortValue, sortFieldsOf, sortStateFor } from "./sorting";

/** Column `meta` read by the table: cell classes and, for a sortable column, the fields it sorts by. */
type ColumnMeta = { className?: string; sortFields?: string[] };

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

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
  /**
   * Title typography, opt-in and independent of `fullWidth`. Defaults to the
   * `fullWidth ? lg : sm` behaviour, so every existing caller is unchanged; pass
   * it only for the exception — a full-width list nested inside another surface
   * (the document browser's right pane), which needs `fullWidth` to drop the card
   * border but must keep the card-sized title of the panels around it.
   */
  titleSize?: "sm" | "lg";
  groupBy?: string;
  groupLabel?: (key: string) => ReactNode;
  groupOrder?: string[];
  hideHeader?: boolean;
  emptyState?: ReactNode;
  /**
   * Suppress the prev/next `TableFooter` even when the API returned
   * `links.next`. For capped lists (a dashboard block showing the first five
   * rows) whose header link goes to the full page instead.
   */
  hidePagination?: boolean;
  onRowClick?: (rowData: any) => void;
  /**
   * Renders a full-width detail row under an expanded row. Receives the row's
   * `jsonApiData`. Setting it makes every row expandable; the row's own cell
   * toggles it via `row.getToggleExpandedHandler()`.
   */
  renderExpandedRow?: (rowData: any) => ReactNode;
  /**
   * Where a sortable column (`enableSorting: true`) sorts. `"server"` (default): a
   * header click sets the retriever's sort and the API orders the whole list.
   * `"client"`: for small, fully loaded tables only; the loaded rows are sorted in
   * the browser and the sort is kept in the page address under `sortKey`.
   */
  sortMode?: "server" | "client";
  /** Address key of the sort in `sortMode="client"` (`sort[<sortKey>]`). Required in client mode. */
  sortKey?: string;
  /**
   * Client mode only: sorts the loaded items itself (grouped tables that sort inside
   * their groups). Without it, rows are sorted by the column's accessor.
   */
  clientSort?: <T>(rows: T[], sort: string | undefined) => T[];
};

type CellRenderer = (context: unknown) => ReactNode;

const isClassComponent = (component: unknown): boolean =>
  typeof component === "function" &&
  !!(component as { prototype?: { isReactComponent?: unknown } }).prototype?.isReactComponent;

/**
 * Renders a column's `cell` through one component type that never changes.
 *
 * TanStack's `flexRender` mounts a function cell as a component. Every table
 * structure hook in this codebase recreates its column closures on each
 * render, so each render handed React a NEW component type per cell and React
 * unmounted and remounted every cell: an EditorSheet opened from a name cell
 * closed whenever the list re-rendered, for a socket event, an in-place row
 * update or a parent re-render (reproduced 2026-09-22 on the Playlists tab).
 * Calling the closure from here keeps the cell subtree alive across renders;
 * hooks inside a cell closure still work, since each StableCell instance
 * always runs the same closure shape.
 */
function StableCell({ render, context }: { render: CellRenderer; context: unknown }) {
  return <>{render(context)}</>;
}

function renderCell(cellDef: unknown, context: unknown): ReactNode {
  if (typeof cellDef === "function" && !isClassComponent(cellDef)) {
    return <StableCell render={cellDef as CellRenderer} context={context} />;
  }
  return flexRender(cellDef as any, context as any);
}

export const ContentListTable = memo(function ContentListTable(props: ContentListTableProps) {
  const { data, fields, checkedIds, toggleId, allowSearch, filters: _filters, fullWidth, onRowClick } = props;
  const t = useTranslations();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState<ExpandedState>(
    props.defaultExpanded === true ? true : typeof props.defaultExpanded === "object" ? props.defaultExpanded : {},
  );

  // Track which pagination direction is loading so we can show a spinner on that button
  const [pendingDirection, setPendingDirection] = useState<"prev" | "next" | null>(null);

  React.useEffect(() => {
    if (data.isLoaded) setPendingDirection(null);
  }, [data.isLoaded]);

  const isClientSort = props.sortMode === "client";
  const clientSortParam = useListSortParam({ sortKey: props.sortKey ?? "" });
  const activeSort = isClientSort ? clientSortParam.sort : data.sort;
  const { clientSort } = props;

  const sourceData = data?.data ?? EMPTY_ARRAY;
  const rowsToRender = useMemo(
    () => (isClientSort && clientSort ? clientSort(sourceData, activeSort) : sourceData),
    [isClientSort, clientSort, sourceData, activeSort],
  );

  const { data: tableData, columns: tableColumns } = useTableGenerator(props.tableGeneratorType, {
    data: rowsToRender,
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

  // Client mode without `clientSort`: TanStack sorts the loaded rows by the column the
  // address sort names. Server mode never sorts rows: the retriever owns the order.
  const clientSorting = useMemo((): SortingState | undefined => {
    if (!isClientSort || clientSort || !activeSort) return undefined;
    for (const column of tableColumns as Array<{ id?: string; accessorKey?: string; meta?: unknown }>) {
      const id = column.id ?? column.accessorKey;
      if (!id) continue;
      const direction = sortStateFor(activeSort, sortFieldsOf({ id, columnDef: { meta: column.meta } }));
      if (direction) return [{ id, desc: direction === "desc" }];
    }
    return undefined;
  }, [isClientSort, clientSort, activeSort, tableColumns]);

  const expansionEnabled = !!props.renderExpandedRow || !!props.expandable;
  const tableState: Partial<TableState> | undefined =
    expansionEnabled || isClientSort
      ? {
          ...(expansionEnabled && { expanded }),
          ...(isClientSort && { sorting: clientSorting ?? [] }),
        }
      : undefined;

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    ...(isClientSort ? { getSortedRowModel: getSortedRowModel(), manualSorting: false } : { manualSorting: true }),
    // Pagination is server-side (the data retriever), never TanStack's. Left on,
    // every core-row-model rebuild queues resetPageIndex -> setState -> re-render,
    // and the table generators rebuild their columns on every render, so it never
    // settles: a render loop that starves other updates (the current user never
    // committed, leaving the sidebar empty).
    autoResetPageIndex: false,
    ...(props.renderExpandedRow && {
      getExpandedRowModel: getExpandedRowModel(),
      // Key rows by record id so an expansion stays with its record when a search or filter reorders the rows.
      getRowId: (row: TableContent<any>, index: number) => row.jsonApiData?.id ?? String(index),
      getRowCanExpand: () => true,
      onExpandedChange: setExpanded,
    }),
    ...(props.expandable && {
      getExpandedRowModel: getExpandedRowModel(),
      getSubRows: props.getSubRows,
      onExpandedChange: setExpanded,
    }),
    ...(tableState && { state: tableState }),
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

  const showFooter = !props.hidePagination && !!(data.next || data.previous);

  // The icon follows the title, not `fullWidth` on its own: a 24px icon beside a
  // 12px title is the mismatch the opt-in exists to avoid.
  const titleIsLarge = (props.titleSize ?? (fullWidth ? `lg` : `sm`)) === `lg`;

  const titleLabel = (
    <div
      className={cn(
        "text-muted-foreground flex items-center gap-x-2  font-light whitespace-nowrap",
        titleIsLarge ? `text-lg` : `text-sm`,
      )}
    >
      {props.titleActions}
      {props.tableGeneratorType.icon && (
        <props.tableGeneratorType.icon className={cn(`text-primary`, titleIsLarge ? `h-6 w-6` : `h-4 w-4`)} />
      )}
      {props.title}
    </div>
  );

  const hasTitleControls = !!(props.functions || props.filters || allowSearch);
  const titleControls = (
    <>
      {props.filters}
      {props.functions}
      {/* `allowSearch !== false`, not `allowSearch`: the search box has
          always rendered here whenever `functions`/`filters` were set, and
          most callers rely on that without passing the flag. Gating on the
          flag alone (as the sibling ContentListGrid does) would silently
          remove search from every such list. This only lets a caller whose
          retriever ignores `search` — e.g. notifications, whose repository
          has no search param and no fulltext index — opt out of a control
          that would do nothing. */}
      {allowSearch !== false && <ContentTableSearch data={data} />}
    </>
  );

  return (
    <div data-help="list.table" className="flex w-full flex-col">
      {/* <div className="overflow-clip rounded-md border"> */}
      <div className={cn(`overflow-clip`, fullWidth ? `` : `rounded-md border`)}>
        {/* On a phone the title bar sits above the table instead of inside its
            header: inside, it is as wide as the table, so on a table wider than
            the screen "Create New", search and filters land off-screen. Above it,
            it wraps within the card while the table scrolls sideways on its own. */}
        {props.title && isMobile && (
          <div
            data-testid="content-list-table-title-bar"
            className="bg-card text-primary flex flex-wrap items-center gap-2 border-b p-4 font-bold"
          >
            <div className="shrink-0">{titleLabel}</div>
            {hasTitleControls && (
              <div className="ms-auto flex flex-wrap items-center justify-end gap-2">{titleControls}</div>
            )}
          </div>
        )}
        <Table>
          <TableHeader className="bg-muted font-semibold">
            {props.title && !isMobile && (
              <TableRow>
                <TableHead
                  className="bg-card rounded-t-lg text-primary p-4 text-start font-bold"
                  colSpan={tableColumns.length}
                >
                  <div className="flex w-full items-center justify-between gap-x-2">
                    {/* <div className="w-full">{fullWidth ? `` : props.title}</div> */}
                    <div className="w-full">{titleLabel}</div>
                    {hasTitleControls && titleControls}
                  </div>
                </TableHead>
              </TableRow>
            )}
            {!props.hideHeader &&
              table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                    const label = header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext());
                    // Only an explicit `true` opts a column in: TanStack defaults a missing key to sortable.
                    // A server-mode retriever without `setSort` (hand-built) cannot sort: plain header.
                    if (
                      header.isPlaceholder ||
                      header.column.columnDef.enableSorting !== true ||
                      (!isClientSort && !data.setSort)
                    ) {
                      return (
                        <TableHead key={header.id} className={meta?.className}>
                          {label}
                        </TableHead>
                      );
                    }
                    const sortFields = sortFieldsOf(header.column);
                    const direction = sortStateFor(activeSort, sortFields);
                    const defaultDirection =
                      !isClientSort && !activeSort ? sortStateFor(data.defaultSort, sortFields) : undefined;
                    const onToggle = () => {
                      const next = nextSortValue(activeSort, sortFields);
                      if (isClientSort) clientSortParam.setSort(next);
                      else data.setSort?.(next);
                    };
                    return (
                      <TableHead
                        key={header.id}
                        className={meta?.className}
                        aria-sort={direction ? ARIA_SORT[direction] : "none"}
                      >
                        <SortableHeader
                          columnId={header.column.id}
                          label={label}
                          direction={direction}
                          defaultDirection={defaultDirection}
                          onToggle={onToggle}
                        />
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
                      <React.Fragment key={row.id}>
                        <TableRow
                          onClick={() => onRowClick?.(row.original.jsonApiData)}
                          className={`group ${onRowClick ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                            return (
                              <TableCell key={cell.id} className={meta?.className}>
                                {renderCell(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        {props.renderExpandedRow && row.getIsExpanded() && (
                          <TableRow data-testid="content-list-table-expanded-row">
                            <TableCell colSpan={tableColumns.length} className="bg-muted/30 px-4 py-3">
                              {props.renderExpandedRow(row.original.jsonApiData)}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                rowModel.rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      onClick={() => onRowClick?.(row.original.jsonApiData)}
                      className={`group ${onRowClick ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                        return (
                          <TableCell key={cell.id} className={meta?.className}>
                            {renderCell(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {props.renderExpandedRow && row.getIsExpanded() && (
                      <TableRow data-testid="content-list-table-expanded-row">
                        <TableCell colSpan={tableColumns.length} className="bg-muted/30 px-4 py-3">
                          {props.renderExpandedRow(row.original.jsonApiData)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
                <TableCell colSpan={tableColumns.length} className="bg-card py-4 text-end">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingDirection("prev");
                        data.previous?.(true);
                      }}
                      disabled={!data.previous || pendingDirection !== null}
                    >
                      {pendingDirection === "prev" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                      )}
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
                        setPendingDirection("next");
                        data.next?.(true);
                      }}
                      disabled={!data.next || pendingDirection !== null}
                    >
                      {pendingDirection === "next" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                      )}
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
