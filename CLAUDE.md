@AGENTS.md
@DESIGN.md

## Claude Code specific

- Run the `design-qa` skill after changing anything under `src/styles/`, `src/components/`, `src/layouts/` or `src/views/`; the Stop hook (`scripts/stop-gate.mjs`) enforces check, build and the overflow test when those paths have uncommitted changes.
- `docs/design/quality-gates.md` defines done; `LICENSES.md` must gain a row before any font, icon or image is added.
