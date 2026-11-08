import { defineConfig } from 'astro/config';

import { satteri } from '@astrojs/markdown-satteri';

import { externalLinks, figures, headingAnchors, readingTime } from './src/plugins/satteri-enrich.mjs';
import { callouts, codeBlocks, tableWrap, taskListCheckbox } from './src/plugins/satteri-table-wrap.mjs';

// Static output, no adapter: the build is plain files and can be hosted anywhere
// (Cloudflare Pages first). SITE_URL is the only deployment-specific value.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.com',
  output: 'static',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
    routing: {
      prefixDefaultLocale: false, // "/" is Korean, "/en/" is English; more locales add a prefix each
    },
  },
  markdown: {
    shikiConfig: {
      // One theme per color scheme; tokens get --shiki-light / --shiki-dark variables and
      // src/styles/prose.css picks the active one, so code blocks follow the site theme.
      themes: { light: 'github-light', dark: 'github-dark-default' }, // dark-default's comment gray passes 4.5:1 on --color-code-bg
      defaultColor: false,
    },
    // Sätteri (Astro 7's default Markdown engine) takes HAST plugins here, not rehypePlugins.
    // Markdown stays plain; these turn it into figures, callouts, code cards, anchors (DESIGN.md §8).
    processor: satteri({
      mdastPlugins: [readingTime],
      hastPlugins: [tableWrap, taskListCheckbox, callouts, codeBlocks, figures, externalLinks, headingAnchors],
    }),
  },
});
