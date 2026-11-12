import { ColumnDef } from "@tanstack/react-table";
import { Link } from "../../../shadcnui";

export const cellLink = <T,>(params: {
  id: string;
  name: string;
  title: string;
  generateUrl: (id: string) => string;
  /** Opt-in: the header sorts the list by this column. */
  sortable?: boolean;
  /** Stored fields the column sorts by, when they differ from `name`. */
  sortFields?: string[];
}): ColumnDef<T> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => <Link href={params.generateUrl(row.getValue(params.id))}>{row.getValue(params.name)}</Link>,
    enableSorting: params.sortable === true,
    ...(params.sortFields && { meta: { sortFields: params.sortFields } }),
    enableHiding: false,
  };
};
