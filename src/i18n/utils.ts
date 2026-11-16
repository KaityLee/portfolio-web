import { getRelativeLocaleUrl } from 'astro:i18n';

import { defaultLocale, locales, type Locale } from './ui';

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

/** Locale from the first path segment; the default locale has no prefix. */
export function getLocaleFromUrl(url: URL): Locale {
  const first = url.pathname.split('/')[1];
  return isLocale(first) ? first : defaultLocale;
}

/** "/en/writing/x" → "/writing/x"; "/writing/x" unchanged. */
export function stripLocale(pathname: string): string {
  const parts = pathname.split('/');
  if (isLocale(parts[1])) parts.splice(1, 1);
  const path = parts.join('/');
  return path === '' ? '/' : path;
}

/** Locale-prefixed path per astro.config i18n routing (no prefix for the default locale). */
export function localizePath(path: string, locale: Locale): string {
  return getRelativeLocaleUrl(locale, path);
}

/** Content entry id "ko/hello-world" → route slug "hello-world". */
export function slugFromId(id: string): string {
  const [first, ...rest] = id.split('/');
  return isLocale(first) ? rest.join('/') : id;
}
