import { ColumnDef } from "@tanstack/react-table";
import { useDateFormatter } from "../../../contexts/DateLocaleContext";

function DateCell({ date }: { date: Date }) {
  const { format } = useDateFormatter();
  return <span className="text-muted-foreground text-xs">{format(date, "dateMedium")}</span>;
}

export const cellDate = (params: { name: string; title: string }): ColumnDef<any> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => {
      const date = row.getValue<Date>(params.name);
      if (!date) return null;
      return <DateCell date={date} />;
    },
    enableSorting: false,
    enableHiding: false,
  };
};
