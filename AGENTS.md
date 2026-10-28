# AGENTS.md — portfolio-web

Rules for coding agents (Codex, Claude Code) and humans working in this **public** repository.

## Non-negotiable

1. The build never reads the private vault or any private repository. Only content under `src/content/` is published, and every file there is a reviewed public copy.
2. No personal contact details (phone, home address), no client or employer confidential information, no credentials. Sample content stays sample content.
3. Deployments are never triggered from here without explicit approval. CI only checks and builds.
4. Do not delete or overwrite existing files; do not rename without approval; report every change at the end.

## Globalization baseline

- **Time**: content `date`/`updated` are ISO 8601 in frontmatter and are formatted only through `src/utils/date.ts` (`Intl.DateTimeFormat` with an explicit `timeZone`). Never hand-format dates.
- **Language**: BCP 47 locales from `src/i18n/ui.ts` (`ko` default, `en`). Every user-facing string is a key in `ui`; no hard-coded UI text in components. Content lives in `src/content/<collection>/<locale>/` and translations share a `translationKey`.
- **Exposure**: content schema carries `visibility` (`private` | `restricted` | `public`) and `draft`. Lists show only `public && !draft`; `restricted` pages are built but `noindex` and unlisted; `private` is never built. Do not add an `isPublic` boolean anywhere.

## Code

- Astro + TypeScript strict. `npm run check && npm run build` must pass.
- Code, identifiers, comments and commit messages in English. Documentation: `README.md` (en) and `README.ko.md` (ko).
- Keep it dependency-light: no UI framework, no CSS framework unless an ADR in `personal-os` says so.
- Conventional Commits.
