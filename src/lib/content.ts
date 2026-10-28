import { getCollection, type CollectionEntry } from 'astro:content';

import { locales, type Locale } from '../i18n/ui';
import { localizePath, slugFromId } from '../i18n/utils';

export type ContentCollection = 'writing' | 'projects';
export type ContentEntry<C extends ContentCollection = ContentCollection> = CollectionEntry<C>;

/** Shown in lists and indexable. */
export function isListed(entry: ContentEntry): boolean {
  return entry.data.visibility === 'public' && !entry.data.draft;
}

/** Gets a page at all: public, or restricted (unlisted + noindex). Private is never built. */
export function isBuildable(entry: ContentEntry): boolean {
  return (entry.data.visibility === 'public' || entry.data.visibility === 'restricted') && !entry.data.draft;
}

function byDateDesc(a: ContentEntry, b: ContentEntry): number {
  return b.data.date.getTime() - a.data.date.getTime();
}

export async function getListed<C extends ContentCollection>(collection: C, locale: Locale) {
  const entries = await getCollection(collection, (entry) => entry.data.lang === locale && isListed(entry));
  return entries.sort(byDateDesc);
}

export async function getBuildable<C extends ContentCollection>(collection: C, locale: Locale) {
  const entries = await getCollection(collection, (entry) => entry.data.lang === locale && isBuildable(entry));
  return entries.sort(byDateDesc);
}

export function entryPath(collection: ContentCollection, entry: ContentEntry, locale: Locale): string {
  return localizePath(`/${collection}/${slugFromId(entry.id)}`, locale);
}

/** hreflang alternates: the path of each buildable translation (same translationKey), by locale. */
export async function getAlternates(
  collection: ContentCollection,
  entry: ContentEntry,
): Promise<Partial<Record<Locale, string>>> {
  const siblings = await getCollection(
    collection,
    (candidate) => candidate.data.translationKey === entry.data.translationKey && isBuildable(candidate),
  );
  const alternates: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    const match = siblings.find((candidate) => candidate.data.lang === locale);
    if (match) alternates[locale] = entryPath(collection, match, locale);
  }
  return alternates;
}

/** getStaticPaths helper shared by every locale's [slug] route. */
export async function detailPaths<C extends ContentCollection>(collection: C, locale: Locale) {
  const entries = await getBuildable(collection, locale);
  return Promise.all(
    entries.map(async (entry) => ({
      params: { slug: slugFromId(entry.id) },
      props: { entry, alternates: await getAlternates(collection, entry) },
    })),
  );
}
