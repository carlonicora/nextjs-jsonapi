export { TableGeneratorRegistry, tableGeneratorRegistry } from "./TableGeneratorRegistry";
export type {
  TableContent,
  TableStructureGeneratorInterface,
  UseTableStructureHook,
  UseTableStructureHookParams,
  UseTableStructureHookReturn,
} from "./types";
export { useUrlRewriter } from "./url.rewriter";
export { useDataListRetriever, type DataListRetriever } from "./useDataListRetriever";
export { useDebounce } from "./useDebounce";
export { usePageUrlGenerator } from "./usePageUrlGenerator";
export { registerTableGenerator, useTableGenerator } from "./useTableGenerator";

// I18n hooks and configuration
export {
  configureI18n,
  getI18nLink,
  useI18nDateFnsLocale,
  useI18nLocale,
  useI18nRouter,
  useI18nTranslations,
} from "../i18n";
export type {
  I18nConfig,
  I18nRouter,
  LinkComponent,
  UseDateFnsLocaleHook,
  UseLocaleHook,
  UseRouterHook,
  UseTranslationsHook,
} from "../i18n";
