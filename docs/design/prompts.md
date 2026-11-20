# Kaity Builds design prompts

Paste either prompt into a coding agent and replace `<task>` with the change or problem to address.

## Design audit

```text
Audit this Kaity Builds design task: <task>.

Read AGENTS.md, DESIGN.md, LICENSES.md, and docs/design/quality-gates.md. Inspect the relevant Astro views, CSS tokens, content, and current screenshots. Keep the audit read-only.

Evaluate the home page against the Kaity Builds visual direction. Look for a full-width charcoal hero, a clear title hierarchy, rectangular links, and staggered diagonal light trails that visibly move on entry. Carry the restrained typography and alignment through the other pages. Check that Kaity builds stays fixed and the suffix types AI agents. from a bare cursor on both routes. Verify the erase cycle, rotation order, and stable layout from DESIGN.md. Prioritize readability on Markdown pages.

Inspect both content routes, / and /en/, in light and dark. Verify that navigation and page or section titles are English on both, that leads, labels, actions and dates follow the route's language, and that Markdown titles, summaries, and prose keep their authored language. For playful copy, use one short, technically accurate reference to math or engineering where it fits. Keep essential labels direct.

Check every single-choice control (language, view switches, tabs, filters): its chosen state must be the shared segmented control from DESIGN.md §8, with an indicator that slides to the new choice rather than jumping.

Report the problems readers encounter, the proposed changes to tokens or shared components, the routes affected, and the checks that would demonstrate the change. Include phone widths and the relevant touch interactions. Cite the observed page or screenshot for each finding.
```

## Implementation and verification

```text
Implement this Kaity Builds design task: <task>.

Read AGENTS.md, DESIGN.md, LICENSES.md, and docs/design/quality-gates.md. Apply the documented visual rules to the affected shared components and views. Record approved token changes in DESIGN.md before editing tokens.css. Keep content routes, Markdown and frontmatter, locale selection, and visibility rules working.

Build every single-choice control (language, view switches, tabs, filters) as the shared segmented control from DESIGN.md §8: `data-segmented`, a `.segmented-indicator` child, choices with `aria-pressed` or `aria-current`, so the chosen indicator slides to the new choice (instantly under reduced motion). Do not give the chosen item its own background or a fixed `::before`.

Keep navigation and page or section titles in short, idiomatic English on both routes; write other interface copy and accessible labels in the route's language (natural Korean under /, English under /en/). Mark English heads on Korean pages with the right HTML language. Use original artwork or assets licensed for free commercial use, including ad-supported use. Self-host only OFL fonts and include their full notices alongside the site. Use MIT or ISC icons with their notices. Record each shipped asset in LICENSES.md before adding it.

Run npm run design:qa and read the affected screenshots in both themes. Open the built site with the iPhone 13 WebKit and Pixel 7 Chrome device profiles. When changing the hero, verify the bare-cursor start, typing and erasing, moving background light, automatic offscreen pause, and the static title under reduced motion. For changed flows, tap the menu, switch the content language (the indicator slides to the new language before the page changes) or theme, follow a project or post link, and check the contents disclosure and scoped scrolling in a wide table or code block. Confirm there are no external font requests and verify the distributed notices when assets change.

Report changed files and tokens, the commands and browser profiles verified, and the screenshot paths. Identify anything that still needs verification. Keep baseline screenshot updates with the site owner.
```
