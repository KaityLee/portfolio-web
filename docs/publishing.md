# Publishing pipeline (vault → this repository)

Private notes never reach this repository directly. A note becomes a post only through these six steps; the first four happen in the vault and on a personal machine, never in CI.

| # | Step | Where | Gate |
|---|---|---|---|
| 1 | Author writes in the vault | Obsidian | `visibility: private` is the default |
| 2 | Request publication | Obsidian | set `publish_status: review`, `publish_targets: [portfolio-web]` |
| 3 | Verify | personal machine (script or manual) | no PII, no client/employer confidential data, no private wikilinks, no local paths, attachments stripped of metadata |
| 4 | Approve | human | `visibility: public`, `publish_status: approved`, and the note id added to `90_System/Publish/allowlist.yaml` |
| 5 | Copy the public version | personal machine | only allowed Markdown + images are copied into `src/content/<collection>/<locale>/`; frontmatter is reduced to this site's schema |
| 6 | Build and deploy | this repo's CI → static host | `npm run check && npm run build` re-validates the schema; `visibility: private` entries are excluded at build time |

Rules

- Flipping `visibility: public` alone publishes nothing: the allowlist is the second gate.
- The copy in step 5 is a derived artifact. Corrections go to the vault first, then are re-copied.
- `restricted` content (for a specific audience, e.g. a recruiter link) is built but unlisted and `noindex`; it still passes steps 3–4.
- Retraction: set `publish_status: retracted` in the vault, remove the file here, redeploy.
