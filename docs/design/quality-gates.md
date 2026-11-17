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
| Asset licenses | self-hosted fonts listed in `LICENSES.md`; no request to a third-party font host; full notices served at `/licenses/third-party.txt` | browser requests and built files |
| Content stress | long Hangul title, post with a 4+ column table, post with a code block, post without images all look right | pages listed in `tests/pages.mjs` |

Pages in the matrix (`tests/pages.mjs`) cover every shared view in Korean and English, plus the long Korean Markdown fixture.

## Mobile browser review

- Serve the built site and open it with Playwright's iPhone 13 profile in WebKit and Pixel 7 profile in Chrome. If Playwright WebKit cannot be installed, use Safari's responsive design mode and record the fallback.
- At phone size, confirm the hero types `AI agents.` from the bare cursor, erases it fully, and enters the next phrase. Confirm that the diagonal trails visibly change position within the first second while the lead and links stay in place. Verify automatic offscreen pause and the static fallback with reduced motion.
- Confirm the menu opens and dismisses, `KO` and `EN` lead to the right content, and theme choice persists. Open a project and a post using touch interaction.
- In the Korean Markdown fixture, expand Contents, follow a heading link, and check that a wide table and a long code line scroll independently. Verify the English controls and Korean text visibly coexist and are marked with the corresponding HTML languages.
- Capture and review representative phone screenshots, including one with the menu open and one with the contents expanded. Report which browser engines and device profiles were used.
