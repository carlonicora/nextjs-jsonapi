import { ColumnDef } from "@tanstack/react-table";

export const cellText = (params: {
  id: string;
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
    cell: ({ row }) => row.getValue(params.name),
    enableSorting: params.sortable === true,
    ...(params.sortFields && { meta: { sortFields: params.sortFields } }),
    enableHiding: false,
  };
};
