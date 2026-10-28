// All dates are stored as ISO 8601 (UTC or explicit offset). Formatting for people happens
// here and only here, with an explicit locale and time zone.
export const DEFAULT_TIME_ZONE = 'Asia/Seoul';

export function formatDate(
  date: Date,
  locale: string,
  options: { timeZone?: string; dateStyle?: Intl.DateTimeFormatOptions['dateStyle'] } = {},
): string {
  const { timeZone = DEFAULT_TIME_ZONE, dateStyle = 'medium' } = options;
  return new Intl.DateTimeFormat(locale, { dateStyle, timeZone }).format(date);
}

/** Machine-readable value for <time datetime>. */
export function toDateTimeAttr(date: Date): string {
  return date.toISOString();
}
