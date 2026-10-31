export {
  configureI18n,
  useI18nRouter,
  useI18nTranslations,
  useI18nLocale,
  useI18nDateFnsLocale,
  getI18nLink,
  getI18nServerLocale,
  getI18nSupportedLocales,
  getI18nDefaultLocale,
} from "./config";

export type {
  I18nConfig,
  I18nRouter,
  UseRouterHook,
  UseTranslationsHook,
  UseLocaleHook,
  GetLocaleFunction,
  UseDateFnsLocaleHook,
  LinkComponent,
} from "./config";
