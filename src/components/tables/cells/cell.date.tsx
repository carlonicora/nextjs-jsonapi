import { ColumnDef } from "@tanstack/react-table";
import { useDateFormatter } from "../../../contexts/DateLocaleContext";

function DateCell({ date, testId }: { date: Date; testId?: string }) {
  const { format } = useDateFormatter();
  return (
    <span className="text-muted-foreground text-xs" data-testid={testId}>
      {format(date, "dateMedium")}
    </span>
  );
}

export const cellDate = (params: {
  name: string;
  title: string;
  /** Opt-in: the header sorts the list by this column. */
  sortable?: boolean;
  /** Stored fields the column sorts by, when they differ from `name`. */
  sortFields?: string[];
  /** Opt-in: text shown when the row has no date (default: nothing). */
  emptyText?: string;
  /** Opt-in: `data-testid` on the cell's text. */
  testId?: string;
}): ColumnDef<any> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => {
      const date = row.getValue<Date>(params.name);
      if (!date) {
        if (params.emptyText === undefined) return null;
        return (
          <span className="text-muted-foreground text-xs" data-testid={params.testId}>
            {params.emptyText}
          </span>
        );
      }
      return <DateCell date={date} testId={params.testId} />;
    },
    enableSorting: params.sortable === true,
    ...(params.sortFields && { meta: { sortFields: params.sortFields } }),
    enableHiding: false,
  };
};
