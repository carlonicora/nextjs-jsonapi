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

export const formatDate = (eventDate: Date, formatOption: FormatOption, locale: string = "en-GB"): string => {
  const formatPart = (date: Date, options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(locale, options).format(date);

  const now = new Date();
  const diff = now.getTime() - eventDate.getTime();

  if (formatOption === "default") {
    if (diff < 24 * 60 * 60 * 1000) formatOption = "timeSince";
    else formatOption = "dateTime";
  }

  if (formatOption === "timeSince") {
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return `${seconds} seconds ago`;
  }

  // Define formatting options
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  // Format based on the option
  switch (formatOption) {
    case "date":
      return formatPart(eventDate, dateOptions);
    case "time":
      return formatPart(eventDate, timeOptions);
    case "dateTime":
      return `${formatPart(eventDate, dateOptions)} ${formatPart(eventDate, timeOptions)}`;
    default:
      throw new Error("Invalid format option");
  }
};

export type { FormatOption };
