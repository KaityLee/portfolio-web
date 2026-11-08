# Third-party assets and their licences

Every font, icon, image, illustration or borrowed snippet that ships in this site has one row here **before** it is committed. Code of this repository is MIT (`LICENSE`); each post declares its own content licence in frontmatter (`license`, default `CC-BY-4.0`).

Rules (from `DESIGN.md` §11): fonts must be SIL OFL 1.1 and self-hosted; icons MIT or ISC; images our own, CC0, or Unsplash/Pexels/Pixabay licence; never CC BY-NC or "editorial use only" (the site may carry ads later); never load assets from a third-party CDN at runtime.

## Fonts

| Asset | Files in this repo | Source | Licence | Added | Notice |
| --- | --- | --- | --- | --- | --- |
| Wanted Sans Variable 1.0.3 | bundled from npm `wanted-sans` (`fonts/webfonts/variable/split/`) | https://github.com/wanteddev/wanted-sans | SIL OFL 1.1 | 2026-11-08 | © Wantedlab; OFL text in `node_modules/wanted-sans/LICENSE` |
| Gowun Batang 400/700 | bundled from npm `@fontsource/gowun-batang` 5.3.0 (Korean + Latin subsets) | https://github.com/yangheeryu/Gowun-Batang | SIL OFL 1.1 | 2026-11-08 | © Yanghee Ryu |
| JetBrains Mono Variable | bundled from npm `@fontsource-variable/jetbrains-mono` 5.3.0 (Latin subset) | https://github.com/JetBrains/JetBrainsMono | SIL OFL 1.1 | 2026-11-08 | © JetBrains |
| D2Coding | bundled from npm `d2coding` 1.3.2 (subset woff2) | https://github.com/naver/d2codingfont (npm build by wan2land) | SIL OFL 1.1 | 2026-11-08 | © NAVER Corp.; Hangul fallback inside code only |

## Icons

| Asset | Files | Source | Licence | Added |
| --- | --- | --- | --- | --- |
| (none yet — theme toggle uses a text glyph) | | | | |

## Images and illustrations

| Asset | Files | Source | Licence | Added |
| --- | --- | --- | --- | --- |
| Favicon | `public/favicon.svg` | drawn for this site | MIT (repo) | 2026-10-28 |

## Tooling (not shipped to visitors)

Playwright (Apache-2.0), axe-core (MPL-2.0), Lighthouse CI (Apache-2.0), Astro (MIT), TypeScript (Apache-2.0). Dev dependencies are not distributed with the site.
