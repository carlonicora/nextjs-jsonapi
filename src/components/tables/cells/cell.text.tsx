import { ColumnDef } from "@tanstack/react-table";

export const cellText = (params: { id: string; name: string; title: string }): ColumnDef<any> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => row.getValue(params.name),
    enableSorting: false,
    enableHiding: false,
  };
};
