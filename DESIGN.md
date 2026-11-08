# DESIGN.md — portfolio-web

- Status: **Direction approved by owner on 2026-11-08** (§12 records the decisions); token values remain adjustable until the first redesigned page passes `npm run design:qa`
- Date: 2026-11-08
- Scope: every visual decision for this site. `src/styles/tokens.css` must mirror §5–§7 exactly; components and views take their rules from §8–§10. Agents read this file (imported from `CLAUDE.md`) before touching any UI and never invent a color, size or pattern that is not here. Rationale and the audit that led here live in the private repo (`personal-os/docs/design/portfolio-web-design-harness.md`).

## 1. Personality

Three words, each with the one sentence an agent needs to apply it.

- **Warm** — the page feels like a person wrote it: soft near-white canvas, rounded corners, friendly illustrations in exactly one place, never corporate gray-on-gray.
- **Precise** — this is an engineer's notebook: tables, code and dates are first-class, aligned to a strict type scale and spacing scale, with nothing decorative inside the reading column.
- **Quietly playful** — small moments of delight (a theme toggle that rotates, a hero band with a hand-drawn motif, a ✨ in a title) are allowed; constant motion, sounds and gradients are not. Spend boldness in one place per page.

## 2. Audiences and their jobs

| Who | Device, time | Needs from the page |
| --- | --- | --- |
| Recruiter or hiring manager | Phone, ~90 seconds | Who is this, 2–3 representative projects, how to contact, is the English version there |
| Engineer reading a long post | Laptop, 10–20 minutes | Comfortable measure, readable tables and code, a table of contents, dark mode at night |
| Future me (Mac mini, evening) | Laptop, dark | Find a post fast, skim headings, copy code |

Korean (`/`) is the default locale and English (`/en/`) is first-class; every pattern must survive Hangul line breaking (`keep-all`) and longer Latin words.

## 3. Primary reference: joshwcomeau.com (patterns, not assets)

Measured on 2026-11-08 at 1440px and 375px. We adopt **patterns**; we never copy code, illustrations, fonts or colors verbatim (his body font Wotfard and code font Cartograph CF are paid; the cloud/avatar art is his).

| Adopt | How it shows up here |
| --- | --- |
| Content-first article column: 686px body, 18px/27px text, 40px/500 h1, 32px/700 h2 in a deep tertiary color, 48px above h2 | §4 type scale, §7 `--measure`, h2 in `--color-tertiary` |
| Header 48px, static on mobile, translucent sticky on desktop, 4 nav items + icon buttons | §8 Header |
| Hero is a soft illustrated band (sky + clouds) with the content starting below it, not a giant headline | §10 Home: an SVG band with our own motif |
| Section labels in small caps letter-spaced secondary color ("ARTICLES AND TUTORIALS") | §8 SectionLabel |
| Meta line in italic: "Filed under X on DATE · Last updated DATE" | §8 Meta |
| Code block as a dark rounded card in both themes, with language label and copy/expand controls | §8 CodeBlock |
| Callout boxes (info / warning / success) with left accent, icon and tinted background | §8 Callout (Markdown `> [!NOTE]`-style blockquote) |
| Inline code with a light tinted pill (2px 6px, 3px radius) | §8 InlineCode |
| Category chips as soft filled pills, not outlined | §8 TagChip |
| A single accent family: primary blue, secondary pink, tertiary deep purple, decorative sky | §5 color tokens with our own values |

| Do not adopt (yet) | Reason |
| --- | --- |
| React interactive widgets inside posts | No UI framework (AGENTS.md); `.mdx` only when a post truly needs interaction, decided per post |
| Sound effects, like counter, 3D avatar | Needs client JS and accounts; not our personality |
| Paid fonts | License allowlist (§4) |
| Cursive code italics | Only if the chosen mono font ships them under OFL |

Secondary references (structure only): `astro-bearblog` (framework-free Astro blog), Max Böck `mxb.dev` (token/theme system in plain CSS), Brian Sunter (content collections for profile + projects).

## 4. Typography

### 4.1 Families (all SIL OFL 1.1, self-hosted, one `LICENSES.md` row each)

| Role | Font | Why | Fallback stack |
| --- | --- | --- | --- |
| Body + UI + headings | **Wanted Sans Variable** (wanteddev, OFL, 7 weights, variable, dynamic-subset woff2 shipped) | Geometric with warmth ("Geometric with a heart, Humanist with a soul"): the closest OFL Hangul face to the friendly personality in §1; Latin drawn in-house to match, so no second Latin font | `'Wanted Sans Variable', 'Wanted Sans', 'Apple SD Gothic Neo', 'Pretendard', 'Noto Sans KR', system-ui, sans-serif` |
| Editorial accent | **Gowun Batang** (Yanghee Ryu, OFL, 400/700) | Pencil-handwriting-inspired Myeongjo; used for the home h1, article/project h1 and the article lead paragraph only. Never for h2 and below, UI or lists | `'Gowun Batang', 'Noto Serif KR', serif` |
| Code | **JetBrains Mono** (OFL, variable 100–800) + **D2Coding** (Naver, OFL) for Hangul inside code | Tall x-height matches Wanted Sans/Pretendard; D2Coding keeps Korean comments mono-width | `'JetBrains Mono', 'D2Coding', ui-monospace, 'SF Mono', Menlo, monospace` |

Alternative body if Wanted Sans feels too soft: **Pretendard Variable** (OFL, Inter Latin + Source Han Hangul, dynamic subset, 9 weights). It is the more neutral, "system" choice; everything else in this file stays the same.

Not allowed: KoPub World (server embedding needs separate approval), any font loaded from Google Fonts CDN (self-host instead), paid faces (Wotfard, Cartograph CF).

### 4.2 Loading

- Install from npm (`wanted-sans`, `@fontsource-variable/jetbrains-mono` or the GitHub release, `d2coding` TTF converted to woff2 ourselves — OFL allows it) and import the **split / dynamic-subset** CSS so a page downloads only the Hangul slices it uses (Wanted Sans ships `variable/split/WantedSansVariable.min.css`; a slice is tens of KB, the full variable file is megabytes).
- `font-display: swap` plus a size-adjusted local fallback (`@font-face { font-family: 'Wanted Sans Fallback'; src: local('Apple SD Gothic Neo'), local('Malgun Gothic'); size-adjust: …; }`) so the swap does not shift layout; CLS is checked by Lighthouse CI.
- Preload only the Latin slice of the body font; never preload Hangul slices.
- Astro 7's Fonts API (`fontProviders.local()`) is the alternative when subsetting is not needed (e.g. JetBrains Mono); either path must end with the files under `src/assets/fonts/` or `public/fonts/`, never a third-party CDN.

### 4.3 Scale and rhythm

Hangul needs a little more size and leading than Latin at the same nominal px, so the base is 17–18px with 1.7 leading (Comeau uses 18/27 for Latin).

```
--step--2: 0.75rem                                   /* section labels */
--step--1: 0.875rem                                  /* meta, captions, chips */
--step-0:  clamp(1.0625rem, 1rem + 0.25vw, 1.125rem) /* body 17→18px */
--step-1:  clamp(1.1875rem, 1.1rem + 0.4vw, 1.3125rem) /* h3, lead paragraph 19→21px */
--step-2:  clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem)   /* h2 24→30px */
--step-3:  clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem)   /* article h1 30→40px */
--step-4:  clamp(2.25rem, 1.8rem + 2.5vw, 3.25rem)   /* home display 36→52px */
--leading-body: 1.7   --leading-heading: 1.3   --leading-tight: 1.15
--measure: 42rem      /* ≈ 36–40 Hangul syllables / 65–75 Latin characters per line */
```

Weights: body 400, UI labels and links 500, h2/h3 700 (Wanted Sans), h1 700 in Gowun Batang; the article lead paragraph is Gowun Batang 400 at `--step-1`. Letter-spacing: `-0.01em` on h1/h2 Latin, `0` on Hangul (never negative on Hangul). `word-break: keep-all; overflow-wrap: anywhere;` everywhere; `text-wrap: balance` on h1, `pretty` on h2–h4 and paragraphs.


## 5. Color

Tokens are defined in OKLCH with a hex fallback. Both themes side by side; contrast targets are checked by `npm run design:qa` (axe) and must hold.

| Token | Light | Dark | Role, contrast target |
| --- | --- | --- | --- |
| `--color-bg` | `#fbfbfd` (oklch 99% 0.003 270) | `#0f1218` (oklch 17% 0.015 265) | Page canvas |
| `--color-surface` | `#ffffff` | `#161a22` | Cards, header when scrolled |
| `--color-surface-2` | `#f1f3f8` | `#1d222c` | Inline code pill, blockquote, table head |
| `--color-text` | `#0b0d12` | `#e8eaf0` | Body text, ≥ 7:1 on bg |
| `--color-text-muted` | `#5b6273` | `#9aa3b5` | Meta, captions, ≥ 4.5:1 on bg |
| `--color-border` | `#e3e6ee` | `#2a3140` | Hairlines, ≥ 3:1 against surface not required (decorative) |
| `--color-primary` | `#3b3fd8` (oklch 47% 0.22 275) | `#8d93ff` | Links, focus ring, active nav; ≥ 4.5:1 on bg |
| `--color-secondary` | `#d1105a` (oklch 52% 0.22 10) | `#ff6b9d` | Section labels, highlights; ≥ 4.5:1 on bg |
| `--color-tertiary` | `#2a1a7a` (oklch 30% 0.15 285) | `#c4b5fd` | h2 headings, ≥ 7:1 on bg |
| `--color-decorative` | `#8ecbf0` | `#2b4a66` | Hero band, illustration fills only; never text |
| `--color-code-bg` | `#101428` | `#0b0e1a` | Code block card (dark in both themes) |
| `--color-code-text` | `#e6e8f2` | `#e6e8f2` | Default token color inside code |
| `--color-selection` | `#ffe9a8` | `rgba(139,133,173,.35)` | `::selection` background |
| `--color-success / info / warning / danger` | `#0f7a3d / #2f5bff / #8f5400 / #c0184a` | `#5ad28a / #86a4ff / #f0b45b / #ff7b9c` | Callout accents |

Rules
- Every color literal in `src/` must be a token from this table; Shiki token colors come from the configured themes (`github-light` / `github-dark-default`; the code card is dark in both site themes, so only the dark palette renders) and are the only exception.
- Hue family is fixed (indigo primary, rose secondary, violet tertiary, sky decorative). A new tint is a new row here first.
- The favicon already uses deep slate `#1f2937` + sky `#60a5fa`; keep it in the same family when redrawing.

## 6. Space, radius, elevation

```
--space-1: 4px   --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 24px  --space-6: 32px  --space-7: 48px  --space-8: 64px  --space-9: 96px
--section-gap: clamp(48px, 8vw, 96px)
--radius-s: 6px  --radius-m: 10px  --radius-l: 16px  --radius-pill: 999px
--shadow-card: 0 1px 2px oklch(20% 0.02 265 / .06), 0 8px 24px -12px oklch(20% 0.02 265 / .18)
--target: 44px   --ease: cubic-bezier(.2,.7,.2,1)
```

No other spacing values. Vertical rhythm inside prose uses `--space-4` between paragraphs, `--space-7` above h2, `--space-6` above h3.

## 7. Layout

- Breakpoints: `320` (minimum, long Hangul titles must not overflow), `390`, `768`, `1280`. Mobile first; media queries only at these four.
- Containers: `--measure: 42rem` (reading column: articles, about, contact, project body), `--container: 64rem` (home, lists, header, footer). Gutter `16px` to 768, `24px` above.
- Header: `48px` tall. Mobile (<768): brand left, icon buttons right (theme, menu); the 5 nav items live in a menu sheet opened by the menu button (native `popover` or `<details>`, no JS library). Desktop (≥768): brand, 4 text links (Writing, Projects, About, Contact; Home is the brand), then locale picker and theme toggle. Sticky with `backdrop-filter` only on desktop.
- Hero band (home only): full-bleed SVG band `clamp(160px, 28vw, 320px)` tall. Motif: a notebook grid (dot or line grid in `--color-decorative` at low opacity) with a handful of nodes connected by curved lines, like a small knowledge graph; nodes use `--color-primary`/`--color-secondary` fills, lines `--color-decorative`. Static, drawn by us as one inline SVG with `aria-hidden`, scaled with `preserveAspectRatio="xMidYMid slice"`; the content column starts under it.
- Ad slots (future): exactly two reserved boxes per article — after the intro paragraph and after the last section — `min-height: 280px` on mobile, `250px` on desktop, never between header and h1, never sticky. Not rendered until AdSense is enabled.
- Footer: 3 columns on desktop (site, links incl. About/Contact/RSS/Source, licence note), stacked on mobile.

## 8. Component inventory

Each component lists its states; all interactive targets are ≥ `--target` square and show a 2px `--color-primary` focus ring (`:focus-visible`), never `outline: none` alone.

| Component | Notes and states |
| --- | --- |
| Header, Nav | default / `aria-current="page"` (primary color, 600) / hover (surface-2 pill) / menu open (mobile sheet, focus trapped by `popover`) |
| LocalePicker | pills; current locale filled surface-2; hidden when a page has one locale |
| ThemeToggle | icon button; icon rotates 180° on toggle (200ms, disabled under reduced motion) |
| SectionLabel | `0.75rem`, letter-spacing `0.12em`, uppercase (Latin) / normal case (Hangul), `--color-secondary` |
| PostCard (list) | title (h3, 1.25rem), summary (muted), Meta; no border, hover lifts title color to primary; `featured` cards get `--color-surface` + `--shadow-card` |
| TagChip | filled `--color-surface-2` pill, `0.8125rem`; current filter in primary tint |
| Meta | italic muted line: "작성일 … · 수정일 …" / "Filed under … on …" using `formatDate` only |
| TOC | desktop: sticky right rail from 1280, current heading in primary; mobile: collapsed `<details>` above the article |
| PrevNext | two cards at article end, previous left, next right |
| Callout | `> [!NOTE] / [!TIP] / [!WARNING] / [!CAUTION]` blockquotes → info/success/warning/danger; left 3px accent, 10px radius, tinted bg at 12% |
| CodeBlock | dark card (`--color-code-bg`), `--radius-m`, language label top-right, copy button (44px) appears on hover/focus; horizontal scroll inside |
| InlineCode | `--color-surface-2` pill, `0.9em`, 3px radius |
| Table | wrapped in `.table-wrap` (already), head in surface-2, 4+ columns widen to 40rem and scroll |
| Figure | image with caption (muted, 0.875rem); every image has a `LICENSES.md` row |
| Footer | see §7 |
| ConsentBanner (future) | bottom sheet, never a modal; only when ads are enabled |

## 9. Motion

- Only `opacity`, `transform` and `color`; 150–250ms; `cubic-bezier(.2,.7,.2,1)`.
- No scroll-triggered or looping animation. The hero band is static.
- `@media (prefers-reduced-motion: reduce)` disables all transitions except color.

## 10. Page contracts

| Page | Above the fold on 390px | Full contract |
| --- | --- | --- |
| Home | Hero band, one-line who-I-am (h1 ≤ 2 lines in Korean), 3 featured projects | then "최근 글" as a list (not cards), link to all; contact row; no walls of chips |
| Writing (list) | SectionLabel, year groups | one row per post: date (muted, fixed width) · title · tags; `featured` posts may show summary; no thumbnails unless `cover` exists |
| Article | Title, Meta, TOC (collapsed) | `--measure` column, Callouts, CodeBlocks, tables, Figure; PrevNext; licence line links to the licence text; restricted posts show a quiet "unlisted" badge |
| Project | Title, one-line summary, facts grid | Problem → Constraints → Design → Trade-offs → Results, in the Markdown; stack as TagChips; repo link |
| About | Portrait-free; who, what I operate, what I am learning | skills as grouped lists, not a chip cloud; CV download only if licence-clear |
| Contact | 3 links max | GitHub, LinkedIn, email (after publishing review) |
| Legal (privacy, licences) | plain `--measure` prose | generated per locale from one view |

## 11. Do-not list

- No CSS or UI framework, no icon font; icons are inline SVG from the allowlist (Lucide / Heroicons / Phosphor / Tabler, MIT or ISC).
- No font that is not SIL OFL and self-hosted; no Google Fonts CDN.
- No image or illustration without a `LICENSES.md` row; no CC BY-NC anywhere (future ads).
- No color, spacing or radius literal outside `tokens.css`.
- No new dependency without an ADR in `personal-os`.
- No change to this file by an agent without the diff being reported in the PR description.

## 12. Decisions (owner, 2026-11-08)

1. **Body font** — Wanted Sans Variable. Pretendard stays the documented alternative only.
2. **Accent hue** — indigo primary / rose secondary / violet tertiary / sky decorative, as tabulated in §5 (matches the existing favicon family).
3. **Hero motif** — notebook grid with connected nodes (a small knowledge graph), §7.
4. **Headings** — Gowun Batang for h1 and the article lead paragraph; Wanted Sans for everything else, §4.

Changing any of these is an owner decision recorded here first, then mirrored in `tokens.css`.
