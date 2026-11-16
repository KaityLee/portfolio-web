# DESIGN.md — portfolio-web

- Direction adopted on 2026-11-16. §12 records this revision.
- Applies to the Astro portfolio routes. Implement the values in §4–§7 as CSS tokens and use the component and page contracts in §8–§10.
- Copy-ready workflow in [design prompts](docs/design/prompts.md). Verification in [quality gates](docs/design/quality-gates.md).

## 1. Personality

- **Precise**. Lead with the system, the decisions behind it, and what was learned. Treat tables, code, and dates as primary content.
- **Cinematic**. Use one full-width charcoal composition on the home page. Carry its alignment, contrast, and thin rules through the rest of the site.
- **Dryly playful**. The name pairs plotting with writing. About can carry one line of math or engineering humor. Use plain English for actions and navigation.

## 2. Audiences and their jobs

| Who | Needs |
| --- | --- |
| Recruiter or hiring manager, often on a phone | Identify the developer's focus, find a representative project, reach About or Contact |
| Engineer reading a post | Read prose and code comfortably, skim the contents, follow links and citations |
| Returning reader | Find a project or recent post and switch content language or theme |

Korean content lives under `/` and English content under `/en/`. Both use English interface copy, including dates, reading time, generated Markdown labels, and accessible names. Content language follows Markdown frontmatter. Mark English controls and Korean content with the appropriate HTML language.

## 3. Visual direction

Give the home page a full-width charcoal hero with large sans-serif type, rectangular actions, and an original static scatter plot. Use a clear visual transition from the hero to the project and writing indexes. Article pages use an uninterrupted reading column and compact technical tools.

## 4. Typography

### 4.1 Families

| Role | Family |
| --- | --- |
| Display, body, interface | Wanted Sans Variable for Latin and Hangul. System sans-serif fallback |
| Code | JetBrains Mono Variable for supported glyphs, D2Coding for Hangul, system monospace fallback |

### 4.2 Loading

Import the installed WOFF2 stylesheet subsets from `src/styles/fonts.css`. Serve fonts from the Astro build origin with `font-display: swap`. Asset sources and license files are listed in `LICENSES.md`.

### 4.3 Scale and rhythm

| Token | Value or role |
| --- | --- |
| `--step--2`, `--step--1` | 0.75rem, 0.875rem for labels, dates, and captions |
| `--step-0`, `--step-1`, `--step-2` | Fluid 16–17px body, 17–19px lead and h3, 20–24px h2 |
| `--step-3`, `--step-4` | Fluid 26–34px detail h1 and 32–44px section or index h1 |
| `--step-hero` | `clamp(2.25rem, 1.3rem + 4vw, 4.75rem)`, weight 500, 1.08 leading |
| `--leading-body`, `--leading-heading`, `--leading-tight` | 1.7, 1.3, 1.15 |

Use tabular numerals on list dates, 400 weight for body, 500–600 for navigation and controls, and 600 for detail titles. Allow Hangul to break between words first and emergency-wrap long tokens.

## 5. Color

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--color-bg` | `#f3f2ee` | `#101214` | Canvas |
| `--color-surface` | `#ffffff` | `#181b1e` | Panels, mobile menu |
| `--color-surface-2` | `#e9e7e1` | `#23272a` | Inline code, table headings, hover |
| `--color-text` | `#17191c` | `#f4f3ef` | Body and titles |
| `--color-text-muted` | `#50555b` | `#a8adb1` | Meta and lead |
| `--color-border` | `#cdcfce` | `#3c4044` | Decorative hairlines |
| `--color-primary` | `#8a491d` | `#e3a66b` | Copper links, focus, active controls |
| `--color-code-bg` | `#101214` | `#101214` | Code block surface |
| `--color-code-text` | `#f4f3ef` | `#f4f3ef` | Code fallback foreground |
| `--color-selection` | `#ead6c3` | `#67452f` | Text selection |
| `--color-success` / `--color-info` / `--color-warning` / `--color-danger` | `#0f7a3d` / `#24577a` / `#8f5400` / `#a32e36` | `#5ad28a` / `#91bedb` / `#f0b45b` / `#ff989e` | Contextual Markdown callouts |

The home hero uses its own fixed palette in both themes. `--hero-bg: #101214`, `--hero-text: #f4f3ef`, `--hero-muted: #b6b9bc`, `--hero-accent: #e3a66b`. Grid and plotted marks use translucent graphite and copper tokens. Use copper sparingly on actionable text, focus indicators, and plot marks. Shiki's GitHub dark palette supplies code highlighting.

## 6. Space, radius, elevation

- Spacing scale `--space-1` to `--space-9` is 4, 8, 12, 16, 24, 32, 48, 64, 96px. Section spacing is `clamp(48px, 8vw, 96px)`.
- Corners use `--radius-s: 2px` and `--radius-m: 4px`. Use a 1px rule to separate functional areas and panels. Keep elevation for the mobile menu sheet with `--shadow-menu: 0 12px 28px #00000024`.
- Mobile controls use `--target: 44px`. Keyboard focus is a 2px copper outline.

## 7. Layout

- Verify at 320, 390, 768, and 1280px. Header switches to inline navigation at 768px and the article contents rail starts at 1280px.
- The shared container is 72rem with 16px gutters below 768px and 24px above. The article stays centered in a 42rem reading column, with the contents rail in its right margin.
- Header height is 56px. Phones show the brand and square theme and menu buttons. The native menu sheet carries navigation and the content-language selector. Desktop shows four inline links, language selector, and theme toggle in a sticky bar.
- The home hero is the first section inside main, full width. Center the title, lead, and link group. Use `clamp(25rem, 46vw, 35rem)` minimum height, with content allowed to grow. Render the plotted points in a low-contrast CSS grid behind the copy; show fewer marks below 768px.
- Footer has site identity, navigation, source and asset-license links, and a content-license note. Stack the groups on phones.
- The two previously defined ad positions remain reserved in the specification for future use, after the article intro and after the last section.

## 8. Component inventory

| Component | Contract |
| --- | --- |
| Navigation and locale picker | Direct English labels, active state with copper text or underline. Locale links show KO and EN with full English accessible labels. |
| Hero links | Primary light button and outlined secondary button on the charcoal surface. Both expose the same copper focus ring. |
| Section heading | Sans-serif title, aligned with a descriptive link to the full index where offered. A top rule separates sections. |
| Project panel | A surface with a hairline border, title, summary, date and authored tags. Two columns from 768px; a sole panel can occupy the row. |
| Writing row | Date and linked title. The full index also shows authored tags and featured summaries. On phones stack metadata and title. From 768px, use the 8rem `--post-date-width` column. |
| Article meta | English metadata labels and English date and duration formatting through `src/utils/date.ts`. Authored tags retain their content language. |
| Contents | Collapsed disclosures on phones and tablets. Desktop sticky rail highlights the current heading. Anchor text follows the article language. |
| Previous / next | Hairline panels with a clear English action label and authored title. |
| Code, callouts and tables | Dark code surface with native horizontal scroll and a labeled copy button. Semantic callout accents and English generated labels. Tables scroll inside a keyboard-focusable wrapper. |
| Markdown figures and links | Keep authored alt text, captions, and anchors. Use the existing local Lucide paths for generated icons. |

## 9. Motion

Use short feedback transitions on controls and respect `prefers-reduced-motion`. The home artwork is static.

## 10. Page contracts

| Page | Contract |
| --- | --- |
| Home | Shared English H1 and lead, then links to projects and writing. Up to three projects with featured items first, up to five recent posts, then contact. |
| Writing | Title and lead followed by writing rows. |
| Projects | Title and lead followed by project panels. |
| Article | Authored header, English metadata, contents, Markdown, previous/next and license. |
| Project detail | Authored title, summary and facts, then Markdown. Use only the facts each project supplies. |
| About | Backend and operations background, one line of dry math humor, and a short list of tools. |
| Contact | Plain English contact status and links approved for public display. |

## 11. Do-not list

- No CSS or UI framework, no icon font; icons are inline SVG from the allowlist (Lucide / Heroicons / Phosphor / Tabler, MIT or ISC).
- No font that is not SIL OFL and self-hosted; no Google Fonts CDN.
- No image or illustration without a `LICENSES.md` row; no CC BY-NC anywhere (future ads).
- No color, spacing or radius literal outside `tokens.css`.
- No new dependency without an ADR in `personal-os`.
- No change to this file by an agent without the diff being reported in the PR description.

## 12. Decisions

On 2026-11-16 the owner chose Plot & Tell, a cinematic home, English interface copy across both content locales, and mobile-browser interaction checks. The previous 2026-11-08 direction used Wanted Sans with Gowun Batang display type, indigo and rose, and an illustrated notebook band.
