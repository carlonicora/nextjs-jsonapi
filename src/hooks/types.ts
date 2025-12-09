import { ColumnDef } from "@tanstack/react-table";
import { PageUrl } from "../permissions/types";
import { DataListRetriever } from "./useDataListRetriever";

export type TableContent<T> = {
  jsonApiData: T;
  [key: string]: any;
};

export interface TableStructureGeneratorInterface<T, U> {
  generateTableStructure: (params: {
    t: (key: string) => string;
    generateUrl: (params: { page: string | PageUrl | string; id?: string }) => string;
    data: T[];
    fields: Array<U>;
    checkedIds?: string[];
    toggleId?: (id: string) => void;
  }) => { data: TableContent<T>[]; columns: ColumnDef<TableContent<T>>[] };
}

export type UseTableStructureHookParams<T, U> = {
  data: T[];
  fields: Array<U>;
  checkedIds?: string[];
  toggleId?: (id: string) => void;
  dataRetriever?: DataListRetriever<T>;
  context?: Record<string, any>;
};

export type UseTableStructureHookReturn<T> = {
  data: TableContent<T>[];
  columns: ColumnDef<TableContent<T>>[];
};

export type UseTableStructureHook<T, U> = (params: UseTableStructureHookParams<T, U>) => UseTableStructureHookReturn<T>;
