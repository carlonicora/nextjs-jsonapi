export type DayPeriod = "am" | "pm";

/** 12-hour clock value + period → 0–23 (12 am → 0, 12 pm → 12). */
export function to24Hour(hour12: number, period: DayPeriod): number {
  const base = hour12 % 12;
  return period === "pm" ? base + 12 : base;
}

/** 0–23 → 12-hour clock value + period (0 → 12 am, 12 → 12 pm). */
export function from24Hour(hour24: number): { hour12: number; period: DayPeriod } {
  const period: DayPeriod = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, period };
}

function dayPeriodOf(formatter: Intl.DateTimeFormat, date: Date): string {
  return formatter.formatToParts(date).find((part) => part.type === "dayPeriod")?.value ?? "";
}

/** The locale's own AM/PM labels, read from Intl (never hard-coded). */
export function dayPeriodLabels(locale: string): { am: string; pm: string } {
  const formatter = new Intl.DateTimeFormat(locale, { hour: "numeric", hourCycle: "h12" });
  return {
    am: dayPeriodOf(formatter, new Date(2000, 0, 1, 1, 0)),
    pm: dayPeriodOf(formatter, new Date(2000, 0, 1, 13, 0)),
  };
}
