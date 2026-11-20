# DESIGN.md — portfolio-web

- Direction adopted on 2026-11-16. §12 records this revision.
- Applies to the Astro portfolio routes. Implement the values in §4–§7 as CSS tokens and use the component and page contracts in §8–§10.
- Copy-ready workflow in [design prompts](docs/design/prompts.md). Verification in [quality gates](docs/design/quality-gates.md).

## 1. Personality

- **Precise**. Lead with the system, the decisions behind it, and what was learned. Treat tables, code, and dates as primary content.
- **Cinematic**. Use one full-width charcoal composition on the home page. Carry its alignment, contrast, and thin rules through the rest of the site.
- **Dryly playful**. The home title pairs real work with dry developer humor. About can carry one line of math or engineering humor. Use plain English for navigation and plain Korean or English for actions, following the route.

## 2. Audiences and their jobs

| Who | Needs |
| --- | --- |
| Recruiter or hiring manager, often on a phone | Identify the developer's focus, find a representative project, reach About or Contact |
| Engineer reading a post | Read prose and code comfortably, skim the contents, follow links and citations |
| Returning reader | Find a project or recent post and switch content language or theme |

Korean content lives under `/` and English content under `/en/`. Heads stay English on both routes: the brand, menu and footer links, page titles, section titles and the table of contents title. Everything else follows the route: under `/` leads, descriptions, actions, labels, accessible names, dates and reading time are Korean, under `/en/` English. Generated Markdown labels (code copy, callouts, heading links) follow the post's frontmatter `lang`. The page `lang` is the route's language; English heads on Korean pages carry `lang="en"`. Copy lives in `src/i18n/ui.ts`: `ui` (English) and `uiKo`, which leaves heads out on purpose.

## 3. Visual direction

Give the home page a full-width charcoal hero with large sans-serif type, rectangular actions, and fine diagonal light trails. Use a clear visual transition from the hero to the project and writing indexes. Article pages use an uninterrupted reading column and compact technical tools.

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
| `--step-hero-phrase` | `clamp(1.75rem, 1.25rem + 3vw, 3.75rem)` for the rotating suffix and cursor |
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

The JSON tool colors its output on the code surface with a fixed palette in both themes, each at least 5:1 on `--color-code-bg`, `--json-selected` and `--json-match`: `--json-key: #9ccbe6`, `--json-string: #8fd4a8`, `--json-number: #e3a66b`, `--json-boolean: #d4aef2`, `--json-null` and `--json-muted: #a8adb1`, `--json-guide: #3c4044` for indent guides, `--json-selected: #23272a` for the selected row and `--json-match: #4a3524` for search matches.

The home hero uses its own fixed palette in both themes. `--hero-bg: #101214`, `--hero-text: #f4f3ef`, `--hero-muted: #b6b9bc`, `--hero-accent: #e3a66b`. Use copper sparingly on actionable text, focus indicators, and the light trails. Shiki's GitHub dark palette supplies code highlighting.

The background wash uses `--hero-wash: #a0653f75` and `--hero-slate: #4255658c`. The trails use `--hero-ray-warm: #c78651b8`, `--hero-ray-cool: #7692aab0`, and `--hero-ray-tip: #f0c299e6`. A fixed radial overlay uses `--hero-scrim: #101214d9` behind the title.

## 6. Space, radius, elevation

- Spacing scale `--space-1` to `--space-9` is 4, 8, 12, 16, 24, 32, 48, 64, 96px. Section spacing is `clamp(48px, 8vw, 96px)`.
- Corners use `--radius-s: 2px` and `--radius-m: 4px`; segmented switches use `--radius-pill: 999px`. Use a 1px rule to separate functional areas and panels. Keep elevation for the mobile menu sheet with `--shadow-menu: 0 12px 28px #00000024`.
- Mobile controls use `--target: 44px`. Keyboard focus is a 2px copper outline.

## 7. Layout

- Verify at 320, 390, 768, and 1280px. Header switches to inline navigation at 768px and the article contents rail starts at 1280px.
- The shared container is 72rem with 16px gutters below 768px and 24px above. Tool result panels are `--tool-panel-width: 20rem`. The article stays centered in a 42rem reading column, with the contents rail in its right margin.
- Header height is 56px. Phones show the brand and square theme and menu buttons. The native menu sheet carries navigation and the content-language selector. Desktop shows five inline links (Writing, Projects, Tools, About, Contact), language selector, and theme toggle in a sticky bar.
- The home hero is the first section inside main, full width. Center the title, lead, and link group. Use `clamp(25rem, 46vw, 35rem)` minimum height, with content allowed to grow. Reserve the height of the longest suffix at the current width. Show five trails on phones and seven from 768px.
- Footer has four groups: site identity (brand and description), titled link columns (Explore, Tools, General), an icon-only row of outside links, and a legal line (copyright and content-license note in `--step--2`, then source and asset-license links). Stack the groups on phones; from 768px identity sits beside the columns and the legal line beside the icon row. From 1024px the first column is at least 24rem so the copyright note stays on one line. Entries live in `src/footer.ts`; reserved slots (`planned`, such as RSS, email, privacy policy, writing categories) are not rendered until they have a target.
- The two previously defined ad positions remain reserved in the specification for future use, after the article intro and after the last section.

## 8. Component inventory

| Component | Contract |
| --- | --- |
| Navigation and locale picker | Direct English labels on both routes, active state with copper text or underline. Locale links show KO and EN, each with its own name as the accessible label (한국어, English), as a segmented control whose indicator slides to the chosen language before the page changes. |
| Hero links | Primary light button and outlined secondary button on the charcoal surface. Both expose the same copper focus ring. |
| Section heading | Sans-serif title, aligned with a descriptive link to the full index where offered. A top rule separates sections. |
| Project panel | A surface with a hairline border, title, summary, date and authored tags. Two columns from 768px; a sole panel can occupy the row. The whole panel is the link: the title link stretches over it, the border and title turn copper on hover, and the focus ring wraps the panel. Tool cards use the same panel. |
| Writing row | Date and linked title. The full index also shows authored tags and featured summaries. On phones stack metadata and title. From 768px, use the 8rem `--post-date-width` column. The whole row is the link, with a light hover wash and an inset focus ring. |
| Article meta | Metadata labels, dates and durations in the route's language through `src/utils/date.ts` (long dates in Korean, medium in English). Authored tags retain their content language. |
| Contents | Collapsed disclosures on phones and tablets. Desktop sticky rail highlights the current heading. Anchor text follows the article language. |
| Previous / next | Hairline panels with a clear action label in the route's language and the authored title. |
| Code, callouts and tables | Dark code surface with native horizontal scroll and a labeled copy button. Semantic callout accents and generated labels in the post's language. Tables scroll inside a keyboard-focusable wrapper. |
| Tool workspace | Input panel on the canvas surface with the action buttons. Results open at once in a full-screen dialog. The output fills the full height on the dark code surface, with search floating at its top right in the code surface's palette (labelled "단어 검색" / "Search") and a vertical scrollbar that is always visible so the length can be judged. All other controls live in a `--tool-panel-width` (20rem) side panel, right by default and movable to the left (remembered in the browser): the result title (the opened file's name, otherwise "입력한 JSON" / "예제 응답"), status, a ✕ that closes, the Tree / Text switch, the selected path in jq syntax (`.a[0].text | fromjson | .b`, since JSONPath cannot enter a string) with Copy jq, Copy JS, Copy Python and Copy value (or Copy all and Download in the text view), and the tree and text options. The ✕, browser Back and Esc close the dialog; the data stays in memory, never in storage or the URL. On phones a slim bar holds the title, search, panel and ✕ buttons, and the panel opens as a drawer below it; a tap on the result or Esc closes the drawer. Ctrl or ⌘ + F focuses the result search. Output that would freeze the page (over 1,000,000 characters, or any line over 10,000) is shown as a cut preview with a note, and is offered in full through Copy all and Download. |
| Segmented control | **Every single-choice control** (the locale picker, the JSON tool's Tree / Text view, and any future tabs, filters or view switches) marks its chosen item with one shared indicator that **slides** to the new choice in 220ms with `--ease` (instantly with reduced motion). Build it with `data-segmented` on a positioned container, a `<span class="segmented-indicator" aria-hidden="true">` as a direct child, and choices as buttons with `aria-pressed` or links with `aria-current`; `src/scripts/segmented.ts` places the indicator, and links slide first and then navigate. Without JS the chosen item keeps its own fill. The container sets `--seg-fill` and `--seg-radius`: the locale picker uses `--color-surface-2` and `--radius-s`; the outlined pill switch (a pill border around uppercase choices, `--radius-pill`) is used for view switches. Each choice is a 44px target. Do not draw a chosen state per item with its own background or a `::before` that cannot slide. |
| Footer | Column titles are English heads in small uppercase muted text; links are 44px targets in body color that turn copper on hover. Icon links are 44px squares with an accessible name in the route's language and no visible label. The Tools column lists every entry in the tools registry. A column or row with no live entries is omitted. |
| Markdown figures and links | Keep authored alt text, captions, and anchors. Use the existing local Lucide paths for generated icons. |

## 9. Motion

Use short feedback transitions on controls. Choices slide: a segmented control's indicator moves from the old choice to the new one (220ms, `--ease`), never jumps, except under reduced motion. Keep `Kaity builds` fixed. Start with only the copper underscore on the second line and type `AI agents.` one character at a time. Hold complete phrases for about two seconds, then erase back to the bare cursor before typing the next phrase. Continue with `data pipelines.`, `smart systems.`, `tiny robots.`, and `cool stuff!` before returning to `AI agents.`. The cursor follows the text and blinks while waiting. The lead is `A curious engineer with too many side quests.` under `/en/` and `사이드 퀘스트가 너무 많은 호기심 많은 엔지니어.` under `/`.

Stagger the CSS light trails so they are visible on entry. They move from lower left to upper right at a constant speed with a `--hero-trail-duration` of 6.6 seconds. Express each trail's starting phase as a fraction of that duration so the spacing stays consistent when tuning the speed. Pause motion offscreen or while the tab is hidden and resume from that position. Use `Kaity builds AI agents.` as the stable accessible heading and the visible fallback for reduced motion or browsers without JavaScript. The fallback shows the trails in fixed positions.

## 10. Page contracts

| Page | Contract |
| --- | --- |
| Home | English typewriter H1; lead and actions in the route's language, then links to projects and writing. Up to three projects with featured items first, up to five recent posts, then contact. |
| Writing | Title and lead followed by writing rows. |
| Projects | Title and lead followed by project panels. |
| Article | Authored header, metadata in the route's language, contents, Markdown, previous/next and license. |
| Project detail | Authored title, summary and facts, then Markdown. Use only the facts each project supplies. |
| About | Backend and operations background, one line of dry math humor, and a short list of tools. |
| Contact | Contact status in the route's language and links approved for public display. |
| Tools | Title and lead followed by a project-panel card per tool. |
| Tool | Title, lead and a one-line privacy note, then the tool input; results open full screen. The JSON Formatter opens JSON stored inside strings, starts large arrays collapsed and keeps number text unchanged. |

## 11. Do-not list

- No CSS or UI framework, no icon font; icons are inline SVG from the allowlist (Lucide / Heroicons / Phosphor / Tabler, MIT or ISC).
- No font that is not SIL OFL and self-hosted; no Google Fonts CDN.
- No image or illustration without a `LICENSES.md` row; no CC BY-NC anywhere (future ads).
- No color, spacing or radius literal outside `tokens.css`.
- No new dependency without an ADR in `personal-os`.
- No change to this file by an agent without the diff being reported in the PR description.

## 12. Decisions

On 2026-11-19 the owner replaced the all-English interface: heads (menu, page and section titles) stay English, and sub-heads and body copy follow the route's language (§2). On 2026-11-16 the owner chose a cinematic home, English interface copy across both content locales, and mobile-browser interaction checks. The current home pairs the Kaity Builds brand with a rotating title and moving diagonal trails. The previous 2026-11-08 direction used Wanted Sans with Gowun Batang display type, indigo and rose, and an illustrated notebook band.
