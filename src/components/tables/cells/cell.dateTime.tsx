import { ColumnDef } from "@tanstack/react-table";
import { useDateFormatter } from "../../../contexts/DateLocaleContext";

function DateTimeCell({ date }: { date: Date }) {
  const { format } = useDateFormatter();
  return <span className="text-muted-foreground text-xs">{format(date, "dateTimeMedium")}</span>;
}

export const cellDateTime = (params: {
  name: string;
  title: string;
  /** Opt-in: the header sorts the list by this column. */
  sortable?: boolean;
  /** Stored fields the column sorts by, when they differ from `name`. */
  sortFields?: string[];
}): ColumnDef<any> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => {
      const date = row.getValue<Date>(params.name);
      if (!date) return null;
      return <DateTimeCell date={date} />;
    },
    enableSorting: params.sortable === true,
    ...(params.sortFields && { meta: { sortFields: params.sortFields } }),
    enableHiding: false,
  };
};
