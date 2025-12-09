import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "../../../shadcnui";

export const cellId = (params: {
  name: string;
  checkedIds?: string[];
  toggleId?: (id: string) => void;
}): ColumnDef<any> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: "",
    cell: ({ row }) =>
      params.toggleId ? (
        <Checkbox
          checked={params.checkedIds?.includes(row.getValue(params.name)) || false}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            params.toggleId?.(row.getValue(params.name));
          }}
          aria-label="Select row"
        />
      ) : null,
    enableSorting: false,
    enableHiding: true,
  };
};
