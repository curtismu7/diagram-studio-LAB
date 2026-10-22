# Changelog

## Unreleased
- Conformance: `CLAUDE.md`, `docs/safety.md`, a forbidden-strings CI job, `MODE=mock`, and SE-cluster manifests with a dry-run deploy script (not deployed).
- Save as HTML: one self-contained, offline walkthrough file.
- Undo/redo (drag = one step), Tidy auto-layout, and New diagram from templates.
- Export SVG and Export PNG for decks (pure `toSvg` in core, collision-aware label placement, canvas PNG capped at 8192 px).

## 0.1.0
- Core: diagram format and validator, pure stepper, pure edit operations, four sample diagrams.
- Server: file store, CRUD, import and export API, `demo-health/1`, doctor, Host and Origin guards.
- Web: React Flow canvas with movable boxes, Simulate, Pause, Resume, Prev, Next, Reset, speed, edit, save a copy, export, import.
- Content pack, shelf entry, Docker and compose (loopback publish pinned by a test), CI.
