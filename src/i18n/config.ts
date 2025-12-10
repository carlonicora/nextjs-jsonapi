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

export type UseDateFnsLocaleHook = () => any; // date-fns Locale type
export type LinkComponent = ComponentType<{ href: string; children: React.ReactNode; [key: string]: any }>;

export interface I18nConfig {
  useRouter: UseRouterHook;
  useTranslations: UseTranslationsHook;
  useLocale?: UseLocaleHook;
  useDateFnsLocale?: UseDateFnsLocaleHook;
  Link: LinkComponent;
  usePathname: () => string;
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

export function useI18nDateFnsLocale(): any {
  if (_config?.useDateFnsLocale) {
    return _config.useDateFnsLocale();
  }
  // Fallback to undefined (Calendar will use default)
  return undefined;
}
