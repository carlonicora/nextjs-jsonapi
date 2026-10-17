import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Checkbox } from "../../../shadcnui";

function SelectRowCheckbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const t = useTranslations();
  return <Checkbox checked={checked} onCheckedChange={onCheckedChange} aria-label={t("ui.labels.select_row")} />;
}

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
        <SelectRowCheckbox
          checked={params.checkedIds?.includes(row.getValue(params.name)) || false}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            params.toggleId?.(row.getValue(params.name));
          }}
        />
      ) : null,
    enableSorting: false,
    enableHiding: true,
  };
};
