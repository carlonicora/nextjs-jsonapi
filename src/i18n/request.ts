import { hasLocale } from "next-intl";
import { getRequestConfig, GetRequestConfigParams } from "next-intl/server";
import { getI18nConfig } from "./routing";

// Messages loader function
let _messagesLoader: ((locale: string) => Promise<Record<string, unknown>>) | null = null;

/**
 * Configure the messages loader for i18n.
 * Must be called before the request config is used.
 *
 * @example
 * ```typescript
 * // In apps/web/src/config/env.ts
 * import { configureI18n, configureI18nMessages } from "@carlonicora/nextjs-jsonapi/i18n";
 *
 * configureI18n({
 *   locales: ["en", "it"],
 *   defaultLocale: "en",
 * });
 *
 * configureI18nMessages(async (locale) =>
 *   (await import(`../messages/${locale}.json`)).default
 * );
 * ```
 */
export function configureI18nMessages(loader: (locale: string) => Promise<Record<string, unknown>>): void {
  _messagesLoader = loader;
}

/**
 * Get the i18n request configuration for server-side rendering.
 * This should be the default export of your app's i18n/request.ts file.
 *
 * @example
 * ```typescript
 * // In apps/web/src/i18n/request.ts
 * import { getI18nRequestConfig } from "@carlonicora/nextjs-jsonapi/i18n";
 * export default getI18nRequestConfig();
 * ```
 */
export function getI18nRequestConfig() {
  return getRequestConfig(async ({ requestLocale }: GetRequestConfigParams) => {
    const config = getI18nConfig();
    const requested = await requestLocale;
    const locale = hasLocale(config.locales, requested) ? requested : config.defaultLocale;

    if (!_messagesLoader) {
      throw new Error(
        "i18n messages loader not configured. Call configureI18nMessages() in your env.ts before using i18n.",
      );
    }

    return {
      locale,
      messages: await _messagesLoader(locale),
    };
  });
}

// Re-export useful types and functions from next-intl
export { hasLocale } from "next-intl";
export type { GetRequestConfigParams } from "next-intl/server";
