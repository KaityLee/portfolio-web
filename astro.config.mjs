import { defineConfig } from 'astro/config';

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
});
