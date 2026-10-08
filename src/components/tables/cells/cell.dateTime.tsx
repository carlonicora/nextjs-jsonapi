import { ColumnDef } from "@tanstack/react-table";
import { useI18nLocale } from "../../../i18n";

function DateTimeCell({ date }: { date: Date }) {
  const locale = useI18nLocale();
  return (
    <span className="text-muted-foreground text-xs">
      {date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", hour12: false })}
    </span>
  );
}

export const cellDateTime = (params: { name: string; title: string }): ColumnDef<any> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => {
      const date = row.getValue<Date>(params.name);
      if (!date) return null;
      return <DateTimeCell date={date} />;
    },
    enableSorting: false,
    enableHiding: false,
  };
};
