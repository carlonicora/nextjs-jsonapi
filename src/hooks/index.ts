export { default as useDebounce } from "./useDebounce";
export { usePageUrlGenerator } from "./usePageUrlGenerator";
export { useUrlRewriter } from "./url.rewriter";
export { useDataListRetriever, type DataListRetriever } from "./useDataListRetriever";
export { TableGeneratorRegistry, tableGeneratorRegistry } from "./TableGeneratorRegistry";
export { registerTableGenerator, useTableGenerator } from "./useTableGenerator";
export type {
  TableContent,
  TableStructureGeneratorInterface,
  UseTableStructureHookParams,
  UseTableStructureHookReturn,
  UseTableStructureHook,
} from "./types";
