// All dates are stored as ISO 8601 (UTC or explicit offset). Formatting for people happens
// here and only here, with an explicit locale and time zone.
export const DEFAULT_TIME_ZONE = 'Asia/Seoul';

// Date style per language: Korean reads best spelled out ("2026년 10월 28일"), English as "Oct 28, 2026".
const DATE_STYLE: Record<string, Intl.DateTimeFormatOptions['dateStyle']> = { ko: 'long' };

export function formatDate(
  date: Date,
  locale: string,
  options: { timeZone?: string; dateStyle?: Intl.DateTimeFormatOptions['dateStyle'] } = {},
): string {
  const { timeZone = DEFAULT_TIME_ZONE, dateStyle = DATE_STYLE[locale.split('-')[0]] ?? 'medium' } = options;
  return new Intl.DateTimeFormat(locale, { dateStyle, timeZone }).format(date);
}

/** Machine-readable value for <time datetime>. */
export function toDateTimeAttr(date: Date): string {
  return date.toISOString();
}

/** Whole minutes as a localized duration ("3분", "3 min"); used for the reading-time meta item. */
export function formatMinutes(minutes: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(minutes);
}
