type FormatOption = "date" | "time" | "dateTime" | "timeSince" | "default";

/**
 * Format a `Date` as `YYYY-MM-DD` using the value's local-time components.
 *
 * Use for JSON:API attributes whose backend field type is `"date"` (calendar
 * date with no time component). `JSON.stringify(new Date(...))` would call
 * `.toISOString()`, which UTC-shifts and can lose a day west of UTC; this
 * helper avoids that by emitting the local-date components verbatim.
 *
 * For `"datetime"` fields use `.toISOString()` instead — those represent an
 * instant in time and the UTC shift is correct.
 */
export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type DateFormatStyle =
  | "date"
  | "dateMedium"
  | "dateLong"
  | "dateTime"
  | "dateTimeMedium"
  | "dateTimeLong"
  | "dateTimeSeconds"
  | "time"
  | "weekdayDateTime"
  | "weekdayDay"
  | "monthYear"
  | "monthYearLong"
  | "month"
  | "monthLong"
  | "dayMonth"
  | "weekday"
  | "weekdayLong";

const NUMERIC_DATE: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };

/**
 * The option set behind each named style. No style pins `hour12` / `hourCycle`:
 * the clock (12 or 24 hours) follows the locale.
 */
export const DATE_STYLE_OPTIONS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
  date: NUMERIC_DATE,
  dateMedium: { dateStyle: "medium" },
  dateLong: { dateStyle: "long" },
  dateTime: { ...NUMERIC_DATE, hour: "numeric", minute: "2-digit" },
  dateTimeMedium: { dateStyle: "medium", timeStyle: "short" },
  dateTimeLong: { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" },
  dateTimeSeconds: { ...NUMERIC_DATE, hour: "numeric", minute: "2-digit", second: "2-digit" },
  time: { hour: "numeric", minute: "2-digit" },
  weekdayDateTime: { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
  weekdayDay: { weekday: "short", day: "numeric", month: "long", year: "numeric" },
  monthYear: { month: "short", year: "numeric" },
  monthYearLong: { month: "long", year: "numeric" },
  month: { month: "short" },
  monthLong: { month: "long" },
  dayMonth: { day: "numeric", month: "short" },
  weekday: { weekday: "short" },
  weekdayLong: { weekday: "long" },
};

/** Public pages never show an all-numeric date: the month is spelled out. */
export const PUBLIC_STYLE_MAP: Partial<Record<DateFormatStyle, DateFormatStyle>> = {
  date: "dateMedium",
  dateTime: "dateTimeMedium",
  dateTimeSeconds: "dateTimeMedium",
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/** One cached `Intl.DateTimeFormat` per locale + option-set key + time zone. */
const cachedDateTimeFormat = (
  locale: string,
  key: string,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): Intl.DateTimeFormat => {
  const cacheKey = `${locale}|${key}|${timeZone ?? ""}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, timeZone ? { ...options, timeZone } : options);
    formatterCache.set(cacheKey, formatter);
  }
  return formatter;
};

const relativeCache = new Map<string, Intl.RelativeTimeFormat>();

const cachedRelativeTimeFormat = (locale: string): Intl.RelativeTimeFormat => {
  let formatter = relativeCache.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
    relativeCache.set(locale, formatter);
  }
  return formatter;
};

const toValidDate = (date: Date | string | undefined): Date | undefined => {
  if (date === undefined || date === null) return undefined;
  const value = date instanceof Date ? date : new Date(date);
  return Number.isNaN(value.getTime()) ? undefined : value;
};

const languageOf = (tag: string): string => tag.split("-")[0].toLowerCase();

const MAX_ACCEPT_LANGUAGE_ENTRIES = 50;

/**
 * The locale every real-world date is formatted in.
 *
 * The first `Accept-Language` entry (quality order) whose language equals the
 * app language's and that `Intl` supports; otherwise the app language. A
 * malformed entry (`*`, an unparseable or zero quality, an unknown tag) is
 * skipped, never thrown on.
 */
export function resolveDateLocale(params: { appLocale: string; acceptLanguage?: string }): string {
  const { appLocale, acceptLanguage } = params;
  if (!acceptLanguage) return appLocale;

  const appLanguage = languageOf(appLocale);
  const entries: { tag: string; quality: number; index: number }[] = [];

  const parts = acceptLanguage.split(",");
  for (let index = 0; index < parts.length && entries.length < MAX_ACCEPT_LANGUAGE_ENTRIES; index++) {
    const [rawTag, ...rawParams] = parts[index].split(";");
    const tag = rawTag.trim();
    if (!tag || tag === "*") continue;

    let quality = 1;
    const qualityParam = rawParams.map((param) => param.trim()).find((param) => param.startsWith("q="));
    if (qualityParam !== undefined) {
      const raw = qualityParam.slice(2);
      quality = /^\d+(\.\d+)?$/.test(raw) ? Number(raw) : NaN;
    }
    if (!(quality > 0)) continue;
    if (languageOf(tag) !== appLanguage) continue;

    entries.push({ tag, quality, index });
  }

  entries.sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const entry of entries) {
    try {
      const [supported] = Intl.DateTimeFormat.supportedLocalesOf([entry.tag]);
      if (supported && languageOf(supported) === appLanguage) return supported;
    } catch {
      // An invalid language tag: skip it.
    }
  }

  return appLocale;
}

/**
 * Formats a date in a named style. Returns "" for `undefined` or a value that
 * does not parse. `isPublic` swaps the all-numeric styles for month-as-word.
 */
export function formatDateStyle(params: {
  date: Date | string | undefined;
  style: DateFormatStyle;
  locale: string;
  timeZone?: string;
  isPublic?: boolean;
}): string {
  const value = toValidDate(params.date);
  if (!value) return "";
  const style = (params.isPublic && PUBLIC_STYLE_MAP[params.style]) || params.style;
  return cachedDateTimeFormat(params.locale, style, DATE_STYLE_OPTIONS[style], params.timeZone).format(value);
}

/** "3 hours ago" / "3 ore fa", always numeric ("1 day ago", never "yesterday"). */
export function formatRelativeDate(params: { date: Date | string; locale: string; now?: Date }): string {
  const value = toValidDate(params.date);
  if (!value) return "";
  const now = params.now ?? new Date();
  const diff = now.getTime() - value.getTime();
  const sign = diff < 0 ? 1 : -1;
  const seconds = Math.floor(Math.abs(diff) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const relative = cachedRelativeTimeFormat(params.locale);
  if (days > 0) return relative.format(sign * days, "day");
  if (hours > 0) return relative.format(sign * hours, "hour");
  if (minutes > 0) return relative.format(sign * minutes, "minute");
  return relative.format(sign * seconds, "second");
}

/** True when the locale's clock is 12-hour (hour cycle h11 / h12). */
export function usesTwelveHourClock(locale: string): boolean {
  const hourCycle = cachedDateTimeFormat(locale, "__hourCycle", { hour: "numeric" }).resolvedOptions().hourCycle;
  return hourCycle === "h11" || hourCycle === "h12";
}

/** The locale to format dates in for an app locale: the app locale itself, English when missing. */
export const dateFormatLocale = (appLocale?: string): string => appLocale ?? "en";

const LEGACY_DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
const LEGACY_TIME_OPTIONS: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

/**
 * @deprecated Use `formatDateStyle` (or `useDateFormatter().format`) and
 * `formatRelativeDate` (or `useDateFormatter().relative`). Kept for other nja
 * apps: same default locale and the same "date" / "time" / "dateTime" output.
 * Pass `now` from render code; the `new Date()` fallback is for legacy callers.
 */
export const formatDate = (
  eventDate: Date,
  formatOption: FormatOption,
  locale: string = "en-GB",
  now?: Date,
): string => {
  const reference = now ?? new Date();
  const diff = reference.getTime() - eventDate.getTime();

  if (formatOption === "default") {
    if (diff < 24 * 60 * 60 * 1000) formatOption = "timeSince";
    else formatOption = "dateTime";
  }

  switch (formatOption) {
    case "timeSince":
      return formatRelativeDate({ date: eventDate, locale, now: reference });
    case "date":
      return cachedDateTimeFormat(locale, "__legacyDate", LEGACY_DATE_OPTIONS).format(eventDate);
    case "time":
      return cachedDateTimeFormat(locale, "__legacyTime", LEGACY_TIME_OPTIONS).format(eventDate);
    case "dateTime":
      return `${cachedDateTimeFormat(locale, "__legacyDate", LEGACY_DATE_OPTIONS).format(eventDate)} ${cachedDateTimeFormat(locale, "__legacyTime", LEGACY_TIME_OPTIONS).format(eventDate)}`;
    default:
      throw new Error("Invalid format option");
  }
};

export type { FormatOption };
