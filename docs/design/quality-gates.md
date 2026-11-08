# Quality gates

What "done" means for any change that touches `src/styles/`, `src/components/`, `src/layouts/` or `src/views/`. `npm run design:qa` checks the automatable rows; the rest is checked by the reviewer against the screenshots the run produces. Values come from `DESIGN.md`.

| Gate | Threshold | Checked by |
| --- | --- | --- |
| Type check and build | `npm run check` and `npm run build` pass | `design:qa` (pre-step) |
| Horizontal overflow | `scrollWidth <= clientWidth` on every page at 320, 390, 768, 1280 | `tests/design.spec.ts` |
| Accessibility | axe: 0 `serious` or `critical` violations, both themes | `tests/design.spec.ts` |
| Touch targets | every `a`, `button`, `[role=button]` in header, footer and cards ≥ 44×44 CSS px at 320 and 390 | `tests/design.spec.ts` |
| Screenshots | `shots/<page>-<width>-<theme>.png` produced for every page in the matrix; the reviewer reads them | `tests/design.spec.ts` |
| Visual regression | `toHaveScreenshot` against `tests/__screenshots__/` when `VISUAL_BASELINE=1`; baselines are updated only by a human with `--update-snapshots` | `tests/design.spec.ts` |
| Contrast | text ≥ 4.5:1, large text ≥ 3:1, UI ≥ 3:1 (WCAG 2.2 1.4.3 / 1.4.11) | axe `color-contrast` rule |
| Tokens only | no hex/rgb/oklch literal outside `src/styles/tokens.css`; no `px` spacing outside the scale | `scripts/check-tokens.mjs` |
| Performance (optional, before a release) | Lighthouse performance ≥ 90, accessibility ≥ 95, CLS < 0.1 on `/` and one article | `npm run design:lh` |
| Fonts | only families listed in `LICENSES.md`; no request to a third-party font host | reviewer, network tab in the Playwright trace |
| Content stress | long Hangul title, post with a 4+ column table, post with a code block, post without images all look right | pages listed in `tests/pages.mjs` |

Pages in the matrix (`tests/pages.mjs`): home, writing list, a long table-heavy article, the hello-world article (code block), a project page, about, contact, and their `/en/` counterparts where they exist.
