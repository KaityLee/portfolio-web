# portfolio-web

Public developer portfolio and technical blog, built with [Astro](https://astro.build) + TypeScript and deployed as static files. Korean is the default locale (`/`), English is served under `/en/`, and the structure is ready for more locales.

Part of the **Personal OS** project: an Obsidian vault is the private source of truth, a private FastAPI backend on a Mac mini provides search and AI assistance, and this site shows only content that went through an explicit review-and-approve pipeline (`docs/publishing.md`).

한국어 안내: [README.ko.md](README.ko.md)

## Status

Phase 1 — scaffold. Pages, i18n routing, content collections, dark mode and CI work; the content is sample content.

## Requirements

- Node 24 (`.nvmrc`)
- npm

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # astro check (TypeScript strict)
npm run build      # static output in dist/
npm run preview
npm run design:qa  # design gates: check, build, tokens, Playwright matrix → shots/
```

## Design system and QA

- `DESIGN.md` — personality, typography (Wanted Sans, Gowun Batang, JetBrains Mono; all SIL OFL, self-hosted), color tokens for both themes, layout and component rules. `src/styles/tokens.css` mirrors it.
- `npm run design:qa` — type check, build, token-literal check, then Playwright (installed Chrome) at 320/390/768/1280 px in light and dark: horizontal overflow, axe (WCAG 2.2 AA), 44 px touch targets, full-page screenshots in `shots/`. `VISUAL_BASELINE=1` adds screenshot comparison against `tests/__screenshots__/`.
- `docs/design/quality-gates.md` — what "done" means; `LICENSES.md` — every third-party asset and its licence.
- `.claude/skills/design-qa` and the Stop hook in `.claude/settings.json` make coding agents run the gates before finishing UI work.

## Structure

```
src/
├── content.config.ts      collections: writing, projects (zod schema incl. lang, translationKey, visibility, draft)
├── plugins/               Sätteri Markdown plugins (tables, task lists, callouts, code bars, figures, external links, heading anchors, reading time)
├── styles/                tokens.css (design tokens), fonts.css (self-hosted @font-face), prose.css (Markdown body), global.css
├── content/
│   ├── writing/{ko,en}/   blog posts, one file per locale, same translationKey
│   └── projects/{ko,en}/  project case studies
├── i18n/ui.ts             locale list + every UI string, per locale
├── i18n/utils.ts          getLocaleFromUrl, useTranslations, localizePath, slugFromId
├── utils/date.ts          Intl.DateTimeFormat helper (explicit timeZone)
├── lib/content.ts         listing/filtering by exposure, translations → hreflang alternates
├── layouts/BaseLayout.astro   <html lang>, SEO/OG, hreflang, theme bootstrap
├── components/            Nav, ThemeToggle, LocalePicker, PostList
├── views/                 one component per page type, locale-agnostic
└── pages/                 thin routes: "/" (ko) and "/en/" (en) wrap the same views
```

## Globalization baseline

| Axis | Rule |
|---|---|
| Time | Frontmatter dates are ISO 8601; rendering goes through `formatDate(date, locale, timeZone)` only |
| Language | BCP 47 locales in `src/i18n/ui.ts`; `defaultLocale: 'ko'`, `prefixDefaultLocale: false`; `hreflang` alternates on every page |
| Exposure | `visibility: private \| restricted \| public` + `draft`; lists show public only, restricted is unlisted + `noindex`, private is never built |
| Deployment | `output: 'static'`, no adapter; `SITE_URL` env var sets canonical/OG origin |

## Adding content

1. Create `src/content/writing/<locale>/<slug>.md` (ASCII kebab-case slug). Translations use the same slug and `translationKey`.
2. Frontmatter: `title, summary, date, tags, lang, translationKey, visibility, draft, license`.
3. Content only reaches this repository through the pipeline in `docs/publishing.md`.

### What plain Markdown turns into

Posts stay ordinary Markdown; the build (`src/plugins/`, `src/styles/prose.css`) does the dressing. No site-specific syntax is needed in the vault.

| You write | The page shows |
| --- | --- |
| `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]` on a blockquote's first line | callout with icon, tint and a localized title |
| a fenced code block with a language | dark code card with language label and copy button |
| `![alt](image.png "caption")` alone in a paragraph | `<figure>` with caption (falls back to the alt text); the image needs a `LICENSES.md` row |
| a link to another site | arrow after the text, `rel="noopener"` |
| `##` – `####` headings | table of contents entries and a link icon to the heading |
| `<kbd>Ctrl</kbd>` | key cap |
| a table | rounded, scrolls sideways on phones |
| nothing | reading time in the meta line, computed from the text |

## Deploy (manual, not automated here)

Cloudflare Pages → connect the GitHub repository → build command `npm run build`, output directory `dist`, environment variable `SITE_URL=https://<your-domain>`. Any static host works the same way.

## License

Code: MIT (`LICENSE`). Content: each post declares its own `license` (default `CC-BY-4.0`). Third-party fonts and assets: `LICENSES.md`.
