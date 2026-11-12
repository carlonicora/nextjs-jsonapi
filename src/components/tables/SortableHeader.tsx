"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "../../shadcnui";
import { SortDirection } from "./sorting";

/**
 * The label of a sortable column header: a button that toggles the column's sort.
 *
 * `direction` is the sort the user chose (primary colour). `defaultDirection` is
 * the list's display-only default order, shown as a muted arrow while no sort is
 * chosen. The enclosing `<TableHead>` carries `aria-sort`.
 */
export function SortableHeader(props: {
  columnId: string;
  label: ReactNode;
  direction?: SortDirection;
  defaultDirection?: SortDirection;
  onToggle: () => void;
}) {
  const shown = props.direction ?? props.defaultDirection;
  const Icon = shown === "asc" ? ArrowUp : shown === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className={props.direction ? "text-primary" : "text-muted-foreground"}
      data-testid={`list-sort-header-${props.columnId}`}
      onClick={props.onToggle}
    >
      {props.label}
      <Icon
        data-testid="list-sort-icon"
        data-direction={shown ?? "none"}
        className={props.direction ? undefined : "text-muted-foreground"}
        aria-hidden="true"
      />
    </Button>
  );
}
