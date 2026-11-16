# Plot & Tell design prompts

Paste either prompt into a coding agent and replace `<task>` with the change or problem to address.

## Design audit

```text
Audit this Plot & Tell design task: <task>.

Read AGENTS.md, DESIGN.md, LICENSES.md, and docs/design/quality-gates.md. Inspect the relevant Astro views, CSS tokens, content, and current screenshots. Keep the audit read-only.

Evaluate the home page against Plot & Tell's visual direction. Look for a full-width charcoal hero, a clear title hierarchy, rectangular controls, and an original static plot. Carry the restrained typography and alignment through the other pages. Prioritize readability on Markdown pages.

Inspect both content routes, / and /en/, in light and dark. Verify that navigation, labels, and site copy use plain English on both, and that Markdown titles, summaries, and prose keep their authored language. For playful copy, use one short, technically accurate reference to math or engineering where it fits. Keep essential labels direct.

Report the problems readers encounter, the proposed changes to tokens or shared components, the routes affected, and the checks that would demonstrate the change. Include phone widths and the relevant touch interactions. Cite the observed page or screenshot for each finding.
```

## Implementation and verification

```text
Implement this Plot & Tell design task: <task>.

Read AGENTS.md, DESIGN.md, LICENSES.md, and docs/design/quality-gates.md. Apply the documented visual rules to the affected shared components and views. Record approved token changes in DESIGN.md before editing tokens.css. Keep content routes, Markdown and frontmatter, locale selection, and visibility rules working.

Use short, idiomatic English for interface copy and accessible labels on both content routes. Mark English interface text and authored Korean text with the right HTML language. Use original artwork or assets licensed for free commercial use, including ad-supported use. Self-host only OFL fonts and include their full notices alongside the site. Use MIT or ISC icons with their notices. Record each shipped asset in LICENSES.md before adding it.

Run npm run design:qa and read the affected screenshots in both themes. Open the built site with the iPhone 13 WebKit and Pixel 7 Chrome device profiles. For changed flows, tap the menu, switch the content language or theme, follow a project or post link, and check the contents disclosure and scoped scrolling in a wide table or code block. Confirm there are no external font requests and verify the distributed notices when assets change.

Report changed files and tokens, the commands and browser profiles verified, and the screenshot paths. Identify anything that still needs verification. Keep baseline screenshot updates with the site owner.
```
