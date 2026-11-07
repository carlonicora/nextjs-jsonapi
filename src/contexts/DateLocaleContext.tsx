"use client";

import * as React from "react";
import { useI18nLocale } from "../i18n/config";
import type { SessionSnapshot } from "../server/ServerSession";
import {
  type DateFormatStyle,
  formatDateStyle,
  formatRelativeDate,
  resolveDateLocale,
  usesTwelveHourClock,
} from "../utils/date-formatter";
import { mapThenable } from "../utils/map-thenable";

/**
 * The locale every real-world date is formatted in.
 *
 * Signed-in shells pass the request's session promise: the provider maps it to
 * the `Accept-Language` header once and never awaits it, so its children render
 * at once; only `useDateLocale()` callers suspend until it settles (the shape of
 * `ViewportProvider`). Public layouts pass `mode="public"`: the app language,
 * with all-numeric styles spelled out. Without a provider: the app language.
 *
 * THIS LIVES IN `contexts/` for the same reason as `ViewportProvider`: the
 * server layouts render it directly, so it needs the "use client" boundary that
 * tsup stamps onto `dist/contexts/*`.
 */
export type DateLocaleSource = { mode: "session"; acceptLanguage: Promise<string | undefined> } | { mode: "public" };

const DateLocaleContext = React.createContext<DateLocaleSource | null>(null);

export function DateLocaleProvider(
  props:
    | { session: Promise<SessionSnapshot>; mode?: "session"; children: React.ReactNode }
    | { mode: "public"; session?: never; children: React.ReactNode },
) {
  const { session, children } = props;
  const value = React.useMemo<DateLocaleSource>(
    () =>
      props.mode === "public" || !session
        ? { mode: "public" }
        : { mode: "session", acceptLanguage: mapThenable(session, (snapshot) => snapshot.acceptLanguage) },
    // Created once, like ViewportProvider's seed.
    [],
  );

  return <DateLocaleContext.Provider value={value}>{children}</DateLocaleContext.Provider>;
}

/** The provider's raw context value (mapped thenable + mode), read WITHOUT suspending — for re-providing it to a tree rendered outside the provider (sonner toasts). */
export function useDateLocaleSource(): DateLocaleSource | null {
  return React.useContext(DateLocaleContext);
}

export function DateLocaleSourceProvider({
  value,
  children,
}: {
  value: DateLocaleSource | null;
  children: React.ReactNode;
}) {
  return <DateLocaleContext.Provider value={value}>{children}</DateLocaleContext.Provider>;
}

export type DateLocale = { locale: string; isPublic: boolean };

/** Suspends on the session (put the caller behind its own `<Suspense>`) when a session provider is above it. */
export function useDateLocale(): DateLocale {
  const source = React.useContext(DateLocaleContext);
  const appLocale = useI18nLocale();
  const acceptLanguage = source?.mode === "session" ? React.use(source.acceptLanguage) : undefined;
  const isPublic = source?.mode === "public";
  const locale = source?.mode === "session" ? resolveDateLocale({ appLocale, acceptLanguage }) : appLocale;

  return React.useMemo(() => ({ locale, isPublic }), [locale, isPublic]);
}

export type DateFormatter = DateLocale & {
  format(date: Date | string | undefined, style: DateFormatStyle, options?: { timeZone?: string }): string;
  relative(date: Date | string, options: { now: Date }): string;
  twelveHourClock: boolean;
};

export function useDateFormatter(): DateFormatter {
  const { locale, isPublic } = useDateLocale();

  return React.useMemo<DateFormatter>(
    () => ({
      locale,
      isPublic,
      format: (date, style, options) => formatDateStyle({ date, style, locale, timeZone: options?.timeZone, isPublic }),
      relative: (date, options) => formatRelativeDate({ date, locale, now: options.now }),
      twelveHourClock: usesTwelveHourClock(locale),
    }),
    [locale, isPublic],
  );
}

/** undefined on the server render and the first client render; the current time after mount (set in useEffect). */
export function useMountedNow(): Date | undefined {
  const [now, setNow] = React.useState<Date | undefined>(undefined);
  React.useEffect(() => {
    setNow(new Date());
  }, []);
  return now;
}
