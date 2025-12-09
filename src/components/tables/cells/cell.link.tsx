import { ColumnDef } from "@tanstack/react-table";
import { Link } from "../../../shadcnui";

export const cellLink = <T,>(params: {
  id: string;
  name: string;
  title: string;
  generateUrl: (id: string) => string;
}): ColumnDef<T> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => <Link href={params.generateUrl(row.getValue(params.id))}>{row.getValue(params.name)}</Link>,
    enableSorting: false,
    enableHiding: false,
  };
};
