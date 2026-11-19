// Tools listed on /tools/. Adding a tool: add an entry here, its strings in src/i18n/ui.ts,
// a view under src/views/tools/ and a page under src/pages/tools/ and src/pages/<locale>/tools/.
import { useTranslations, type Locale } from '../i18n/ui';

export interface ToolEntry {
  slug: string;
  title: string;
  summary: string;
  tags: readonly string[];
}

/** Tool titles are English heads on every route; summaries follow the route's language. */
export function tools(locale: Locale): readonly ToolEntry[] {
  const t = useTranslations(locale);
  return [{ slug: 'json-formatter', title: t('tools.json.title'), summary: t('tools.json.summary'), tags: ['JSON', 'LLM'] }];
}

export function toolPath(slug: string): string {
  return `/tools/${slug}`;
}
