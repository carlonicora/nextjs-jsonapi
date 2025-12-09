import { ColumnDef } from "@tanstack/react-table";
import React from "react";

export const cellComponent = (params: {
  id: string;
  name: string;
  title: string;
  component: React.ReactNode;
}): ColumnDef<any> => {
  return {
    id: params.name,
    accessorKey: params.name,
    header: params.title,
    cell: ({ row }) => params.component,
    enableSorting: false,
    enableHiding: false,
  };
};
