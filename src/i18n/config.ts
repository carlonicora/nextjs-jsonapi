import { ComponentType } from "react";

// Types for injected hooks
export interface I18nRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
}

export type UseRouterHook = () => I18nRouter;
export type UseTranslationsHook = (namespace?: string) => (key: string, values?: Record<string, any>) => string;
export type UseLocaleHook = () => string;
export type GetLocaleFunction = () => Promise<string>;

export type UseDateFnsLocaleHook = () => any; // date-fns Locale type
export type LinkComponent = ComponentType<{ href: string; children: React.ReactNode; [key: string]: any }>;

export interface I18nConfig {
  useRouter: UseRouterHook;
  useTranslations: UseTranslationsHook;
  useLocale?: UseLocaleHook;
  useDateFnsLocale?: UseDateFnsLocaleHook;
  Link: LinkComponent;
  usePathname: () => string;
  /**
   * Server-side locale for API requests (pass next-intl's `getLocale` from `next-intl/server`).
   *
   * The library never imports next-intl itself: instrumentation loads the library, and
   * next-intl's `getLocale` pulls in the app's `i18n/request.ts`, which reads
   * `next/root-params` — a module only allowed inside the app directory.
   */
  getLocale: GetLocaleFunction;
  /**
   * Locales the app supports. The first entry is the fallback.
   * Defaults to `["en"]` when omitted.
   */
  supportedLocales?: string[];
}

// Private storage
let _config: I18nConfig | null = null;

// Configuration function (called by app at startup)
export function configureI18n(config: I18nConfig): void {
  _config = config;
}

// Hooks for library components to use
export function useI18nRouter(): I18nRouter {
  if (!_config?.useRouter) {
    throw new Error("i18n not configured. Call configureI18n() at app startup.");
  }
  return _config.useRouter();
}

export function useI18nTranslations(namespace?: string): (key: string, values?: Record<string, any>) => string {
  if (!_config?.useTranslations) {
    // Fallback: return key as-is (safe for server/client)
    return (key: string) => key;
  }
  return _config.useTranslations(namespace);
}

export function getI18nLink(): LinkComponent {
  if (!_config?.Link) {
    throw new Error("i18n not configured. Call configureI18n() at app startup.");
  }
  return _config.Link;
}

export function useI18nLocale(): string {
  if (_config?.useLocale) {
    return _config.useLocale();
  }
  // Fallback to English (safe for server/client)
  return "en";
}

/** The server-side locale from the app's `getLocale`. Throws when `configureI18n` has not run. */
export async function getI18nServerLocale(): Promise<string> {
  if (!_config?.getLocale) {
    throw new Error("i18n not configured. Call configureI18n() with getLocale at app startup.");
  }
  return _config.getLocale();
}

export function useI18nDateFnsLocale(): any {
  if (_config?.useDateFnsLocale) {
    return _config.useDateFnsLocale();
  }
  // Fallback to undefined (Calendar will use default)
  return undefined;
}

/** The app's supported locales. Defaults to `["en"]` when not configured. */
export function getI18nSupportedLocales(): string[] {
  if (_config?.supportedLocales && _config.supportedLocales.length > 0) {
    return _config.supportedLocales;
  }
  return ["en"];
}
