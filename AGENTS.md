# AGENTS.md — portfolio-web

Rules for coding agents (Codex, Claude Code) and humans working in this **public** repository.

## Non-negotiable

1. The build never reads the private vault or any private repository. Only content under `src/content/` is published, and every file there is a reviewed public copy.
2. No personal contact details (phone, home address), no client or employer confidential information, no credentials. Sample content stays sample content.
3. Deployments are never triggered from here without explicit approval. CI only checks and builds. Note that Cloudflare Workers Builds (`wrangler.jsonc`) deploys production automatically when `main` changes, so merging or pushing to `main` is itself a deployment and needs the owner's approval.
4. Do not delete or overwrite existing files; do not rename without approval; report every change at the end.

## Globalization baseline

- **Time**: content `date`/`updated` are ISO 8601 in frontmatter and are formatted only through `src/utils/date.ts` (`Intl.DateTimeFormat` with an explicit `timeZone`). Never hand-format dates.
- **Language**: BCP 47 content locales from `src/i18n/ui.ts` (`ko` default, `en`). Interface copy comes from `useTranslations(locale)`: heads (menu, page and section titles) stay English on both routes, everything else follows the route (`uiKo` for `ko`, DESIGN.md §2). Content lives in `src/content/<collection>/<locale>/` and translations share a `translationKey`. Mark English heads on Korean pages with `lang="en"` (`headLang()`).
- **Exposure**: content schema carries `visibility` (`private` | `restricted` | `public`) and `draft`. Lists show only `public && !draft`; `restricted` pages are built but `noindex` and unlisted; `private` is never built. Do not add an `isPublic` boolean anywhere.

## Code

- Astro + TypeScript strict. `npm run check && npm run build` must pass.
- Code, identifiers, comments and commit messages in English. Documentation: `README.md` (en) and `README.ko.md` (ko).
- Keep it dependency-light: no UI framework, no CSS framework unless an ADR in `personal-os` says so.
- Conventional Commits.

## Design

- `DESIGN.md` is the single source of visual decisions; `src/styles/tokens.css` mirrors it. No color, spacing, radius or font literal anywhere else (`node scripts/check-tokens.mjs` enforces it).
- Copyable design audit and implementation prompts live in `docs/design/prompts.md`.
- Single-choice controls (language, view switches, tabs, filters) always use the shared segmented control (`data-segmented`, `src/scripts/segmented.ts`, DESIGN.md §8) so the chosen indicator slides; never a per-item background for the chosen state.
- After changing `src/styles/`, `src/components/`, `src/layouts/` or `src/views/`, run `npm run design:qa` (check, build, token check, Playwright at 320/390/768/1280 × light/dark: overflow, axe, touch targets, screenshots in `shots/`) and read the screenshots before reporting. `docs/design/quality-gates.md` defines done.
- Fonts, icons and images need a row in `LICENSES.md` first (OFL fonts self-hosted, MIT/ISC icons, no CC BY-NC). Visual baselines under `tests/__screenshots__/` are updated only by the owner.
