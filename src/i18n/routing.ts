import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export interface I18nConfig {
  locales: readonly string[];
  defaultLocale: string;
}

// Internal state
let _config: I18nConfig = {
  locales: ["en"],
  defaultLocale: "en",
};

let _routing: ReturnType<typeof defineRouting> | null = null;
let _navigation: ReturnType<typeof createNavigation> | null = null;

/**
 * Configure i18n settings. Must be called before using routing/navigation utilities.
 * Typically called in your app's config/env.ts file.
 *
 * @example
 * ```typescript
 * // In apps/web/src/config/env.ts
 * import { configureI18n } from "@carlonicora/nextjs-jsonapi/i18n";
 *
 * configureI18n({
 *   locales: ["en", "it"],
 *   defaultLocale: "en",
 * });
 * ```
 */
export function configureI18n(config: I18nConfig): void {
  _config = config;
  _routing = null;
  _navigation = null;
}

/**
 * Get the current i18n configuration.
 */
export function getI18nConfig(): I18nConfig {
  return _config;
}

function ensureInitialized() {
  if (!_routing) {
    _routing = defineRouting({
      locales: _config.locales,
      defaultLocale: _config.defaultLocale,
    } as any);
    _navigation = createNavigation(_routing);
  }
  return { routing: _routing, navigation: _navigation! };
}

// Lazy-initialized exports
export const routing = new Proxy({} as ReturnType<typeof defineRouting>, {
  get(_, prop) {
    const { routing } = ensureInitialized();
    return (routing as Record<string, unknown>)[prop as string];
  },
});

// Navigation utilities - using getters for lazy initialization
export const Link = new Proxy((() => null) as unknown as ReturnType<typeof createNavigation>["Link"], {
  get(_, prop) {
    const { navigation } = ensureInitialized();
    return (navigation.Link as Record<string, unknown>)[prop as string];
  },
  apply(_, thisArg, args) {
    const { navigation } = ensureInitialized();
    return (navigation.Link as Function).apply(thisArg, args);
  },
});

export const redirect = new Proxy((() => {}) as ReturnType<typeof createNavigation>["redirect"], {
  apply(_, thisArg, args) {
    const { navigation } = ensureInitialized();
    return (navigation.redirect as Function).apply(thisArg, args);
  },
});

export const usePathname = new Proxy((() => "") as ReturnType<typeof createNavigation>["usePathname"], {
  apply(_, thisArg, args) {
    const { navigation } = ensureInitialized();
    return (navigation.usePathname as Function).apply(thisArg, args);
  },
});

export const useRouter = new Proxy((() => ({})) as ReturnType<typeof createNavigation>["useRouter"], {
  apply(_, thisArg, args) {
    const { navigation } = ensureInitialized();
    return (navigation.useRouter as Function).apply(thisArg, args);
  },
});

export const getPathname = new Proxy((() => "") as ReturnType<typeof createNavigation>["getPathname"], {
  apply(_, thisArg, args) {
    const { navigation } = ensureInitialized();
    return (navigation.getPathname as Function).apply(thisArg, args);
  },
});
