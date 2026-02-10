import { ColumnDef } from "@tanstack/react-table";

export const cellDate = (params: { name: string; title: string }): ColumnDef<any> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => {
      const date = row.getValue<Date>(params.name);
      if (!date) return null;
      return (
        <span className="text-muted-foreground text-xs">{date.toLocaleDateString("en", { dateStyle: "medium" })}</span>
      );
    },
    enableSorting: false,
    enableHiding: false,
  };
};
