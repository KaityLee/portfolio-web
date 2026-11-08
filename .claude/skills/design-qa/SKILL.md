---
name: design-qa
description: Run the design QA harness after changing styles, components, layouts or views, read the screenshots at every viewport and theme, and report against docs/design/quality-gates.md. Use before claiming any UI change is done.
---

# design-qa

Run after any change under `src/styles/`, `src/components/`, `src/layouts/` or `src/views/`, and before reporting a UI task as finished.

1. `npm run design:qa` — builds the site, serves `dist/`, then runs `tests/design.spec.ts` on every page in `tests/pages.mjs` at 320, 390, 768 and 1280 px in light and dark. Screenshots land in `shots/`.
2. Read every screenshot the task could have affected with the Read tool. Compare what you see with `DESIGN.md` §7–§10 (layout, component states, page contracts). Look for: clipped or per-character wrapped Hangul, tables or code escaping their wrapper, header wrapping, missing focus styles, wrong theme colors in code blocks.
3. If a test failed, fix the cause, never the assertion. Do not touch `tests/__screenshots__/`; baseline updates are the owner's job (`npx playwright test --update-snapshots`).
4. Report in this order: files changed; tokens added or changed in `src/styles/tokens.css` (with the matching `DESIGN.md` row); the `design:qa` summary line; the screenshot paths you looked at; anything in `DESIGN.md` that turned out underspecified, as a proposed wording rather than a silent decision.

Never add a dependency, a font, an icon set or an image to make a gate pass; those need an ADR or a `LICENSES.md` row first.
