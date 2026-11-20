# Third-party assets and their licences

Every font, icon, image, illustration or borrowed snippet that ships in this site has one row here **before** it is committed. Code of this repository is MIT (`LICENSE`); each post declares its own content licence in frontmatter (`license`, default `CC-BY-4.0`).

Rules (from `DESIGN.md` §11). Use self-hosted SIL OFL 1.1 fonts, MIT or ISC icons, and original or freely licensed imagery that permits commercial use. Serve the complete notices from `public/licenses/` alongside the assets.

## Fonts

| Asset | Files in this repo | Source | Licence | Added | Notice |
| --- | --- | --- | --- | --- | --- |
| Wanted Sans Variable 1.0.3 | bundled from npm `wanted-sans` (`fonts/webfonts/variable/split/`) | [Wanted Sans](https://github.com/wanteddev/wanted-sans/blob/main/OFL.txt) | SIL OFL 1.1 | 2026-11-08 | [Wanted Sans notice](public/licenses/third-party.txt) |
| JetBrains Mono Variable | bundled from npm `@fontsource-variable/jetbrains-mono` 5.3.0 | [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1 | 2026-11-08 | [JetBrains Mono notice](public/licenses/third-party.txt) |
| D2Coding | bundled from npm `d2coding` 1.3.2 (subset WOFF2) | [NAVER](https://github.com/naver/d2-coding-font/blob/master/OFL.txt), npm build by wan2land | SIL OFL 1.1 | 2026-11-08 | [D2Coding notice](public/licenses/third-party.txt) |

## Icons

| Asset | Files | Source | Licence | Added | Notice |
| --- | --- | --- | --- | --- | --- |
| Lucide icons (menu, x, sun, moon, arrow-right, chevron-up, chevron-down, search, settings-2, arrow-left-right; info, lightbulb, triangle-alert, copy, check, arrow-up-right, link) | inline paths in `src/components/Icon.astro`; CSS mask data URIs in `src/styles/prose.css` | [Lucide](https://lucide.dev/license) | ISC (Feather-derived glyphs MIT) | 2026-11-08 | [Lucide and Feather notices](public/licenses/third-party.txt) |

## Images and illustrations

| Asset | Files | Source | Licence | Added |
| --- | --- | --- | --- | --- |
| Favicon (three plotted points) | `public/favicon.svg` | drawn for this site | MIT (repo) | 2026-11-16 |
| Home background (CSS light trails) | `src/components/HeroBand.astro`, `src/styles/global.css` | drawn for this site | MIT (repo) | 2026-11-16 |
| Publish flow diagram (sample post figure) | `src/assets/writing/publish-flow.svg` | drawn for this site | MIT (repo) | 2026-11-09 |

## Tooling (not shipped to visitors)

Playwright (Apache-2.0), axe-core (MPL-2.0), Lighthouse CI (Apache-2.0), Astro (MIT), TypeScript (Apache-2.0). Dev dependencies are not distributed with the site.
