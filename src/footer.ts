// Footer content (DESIGN.md §7): identity, titled link columns, an icon row and a legal line.
// Entries marked `planned` reserve a slot without rendering it; to publish one, give it an href
// and set `status: 'live'`. A column or row with no live entries is not rendered at all.
import type { IconName } from './components/Icon.astro';
import { useTranslations, type Locale } from './i18n/ui';
import { localizePath } from './i18n/utils';
import { site } from './site';
import { toolPath, tools } from './tools/registry';

export type FooterStatus = 'live' | 'planned';

export interface FooterLink {
  label: string;
  href: string;
  status: FooterStatus;
  /** Off-site link: opens with rel="noopener". */
  external?: boolean;
}

export interface FooterColumn {
  /** English head on every route (DESIGN.md §2). */
  title: string;
  links: readonly FooterLink[];
}

export interface FooterSocialLink extends FooterLink {
  icon: IconName;
}

export function live<T extends { status: FooterStatus }>(items: readonly T[]): T[] {
  return items.filter((item) => item.status === 'live');
}

export function footerColumns(locale: Locale): FooterColumn[] {
  const t = useTranslations(locale);
  const path = (p: string) => localizePath(p, locale);
  const columns: FooterColumn[] = [
    {
      title: t('footer.col.explore'),
      links: [
        { label: t('nav.writing'), href: path('/writing'), status: 'live' },
        { label: t('nav.projects'), href: path('/projects'), status: 'live' },
        { label: t('nav.tools'), href: path('/tools'), status: 'live' },
        // Writing categories go here once posts carry a category.
      ],
    },
    {
      title: t('footer.col.tools'),
      links: tools(locale).map((tool) => ({ label: tool.title, href: path(toolPath(tool.slug)), status: 'live' as const })),
    },
    {
      title: t('footer.col.general'),
      links: [
        { label: t('nav.about'), href: path('/about'), status: 'live' },
        { label: t('nav.contact'), href: path('/contact'), status: 'live' },
      ],
    },
  ];
  return columns.map((c) => ({ ...c, links: live(c.links) })).filter((c) => c.links.length > 0);
}

/** Icon-only links; `label` is the accessible name and follows the route's language. */
export function footerSocial(locale: Locale): FooterSocialLink[] {
  const t = useTranslations(locale);
  return live<FooterSocialLink>([
    { icon: 'github', label: t('footer.social.github'), href: site.githubProfileUrl, status: 'live', external: true },
    { icon: 'rss', label: t('footer.social.rss'), href: '', status: 'planned' }, // needs a feed route
    { icon: 'mail', label: t('footer.social.mail'), href: '', status: 'planned' }, // after contact review
    // LinkedIn: not in Lucide; choose an icon source (LICENSES.md row first) before adding.
  ]);
}

/** Source, licences and policies, next to the copyright line. */
export function footerLegal(locale: Locale): FooterLink[] {
  const t = useTranslations(locale);
  return live<FooterLink>([
    { label: t('footer.source'), href: site.repoUrl, status: 'live', external: true },
    { label: t('footer.assetLicenses'), href: '/licenses/third-party.txt', status: 'live' },
    { label: t('footer.privacy'), href: '', status: 'planned' }, // required before AdSense
  ]);
}
