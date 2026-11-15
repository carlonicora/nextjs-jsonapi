"use client";

import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shadcnui";
import { cn } from "../../../utils";

export type AnalyticsRankTableColumn = {
  label: string;
  /** Numeric columns are right-aligned (logically: end) tabular numbers. */
  numeric?: boolean;
};

export type AnalyticsRankTableRow = {
  id: string;
  /** One cell per column, in column order. */
  cells: ReactNode[];
  testId?: string;
};

type Props = {
  columns: AnalyticsRankTableColumn[];
  rows: AnalyticsRankTableRow[];
};

/**
 * The table shell shared by the analytics ranked lists (the Breakdown tabs and
 * the page-list cards). Internal to the feature: not exported from the barrel.
 */
export function AnalyticsRankTable({ columns, rows }: Props) {
  return (
    // The package's <Table> wraps itself in an `overflow-x-clip` container, which
    // would swallow the overflow before this scroller ever saw it — hence the
    // child override. Wide tables must scroll, never widen the page.
    <div className="overflow-x-auto [&_[data-slot=table-container]]:overflow-x-visible">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.label} className={cn("text-xs", column.numeric && "text-end")}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} data-testid={row.testId}>
              {row.cells.map((cell, index) => (
                <TableCell key={index} className={cn("text-xs", columns[index]?.numeric && "text-end tabular-nums")}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
