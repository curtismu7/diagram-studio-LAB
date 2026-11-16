# Changelog

## Unreleased
- Box details: click a box and it expands in place, details below its title: its group, its code pointers (links to the pinned commit), reach (boxes upstream and downstream along the arrows), and the boxes it sends to and receives from (each opens that box). Click again, Close, or the empty canvas collapses it; Copy link and `?d=<id>&box=<box>` open a diagram with a box expanded. Pure `boxPassport` in core.
- Apps: the flow of cedar-act-sub-LAB (`cedar-act-sub-flow`, `CEDAR_ACT_SUB_FLOW`) joins the app diagrams, so that lab loads its diagram by name from studio data (rule 17).
- Apps: the flow of cedar-in-privilege-LAB (`cedar-in-privilege-flow`, `CEDAR_IN_PRIVILEGE_FLOW`) joins the app diagrams, so that lab loads its diagram by name from studio data (rule 17).
- Arrow labels: drawn above the boxes (not as SVG text under them) and placed so no two overlap and none sits on a box; the label of the arrow being walked turns blue and bold and is raised above the others during Simulate; a click on a label selects its arrow. Across the 49 diagrams the studio ships, label overlaps measured in the browser went from 37 to 0 and labels sitting on a box from 82 to 1.
- Validator: an arrow may carry an optional `color` (the group color names). Already accepted by the validator copies in the labs that draw coloured arrows; now the canonical validator agrees. The studio does not draw it yet.
- Optional `sources` on a node (repo-relative path and line range, up to 3) and `repo` on the diagram (https URL and 40-character commit): shape checked by the validator, shown in the box detail as links to the pinned commit, and `core/src/verify-sources.js` for a lab's own test to check the files and line ranges exist.
- Verification mark in the header: the shared `VerifyMark` (vendored byte for byte, pinned, from AI-DEMO-Standalone `shared/verify-mark`) shows this lab's own Verified / In progress mark from the demo shelf, inside the header menu beside the Shelf link. It uses the same `api/shelf` call as the Shelf link, so it shows when that call reaches the shelf (through the lab-proxy) and nothing when the lab runs on its own port, the shelf has no mark for it, or the shelf is unreachable.
- On the wire: optional `step.wire` (request, response, tokens decoded claim by claim with plain-language meanings, notice, or a no-traffic note) shown in the step list, detail panel, presenter and embed views and the HTML export. Example data for 10 token and MCP flows (`core/src/wiredata.js`); signatures are always `sig-not-real`.
- Conformance: `CLAUDE.md`, `docs/safety.md`, a forbidden-strings CI job, `MODE=mock`, and SE-cluster manifests with a dry-run deploy script (not deployed).
- Save as HTML: one self-contained, offline walkthrough file.
- Undo/redo (drag = one step), Tidy auto-layout, and New diagram from templates.
- Export SVG and Export PNG for decks (pure `toSvg` in core, collision-aware label placement, canvas PNG capped at 8192 px).

## 0.1.0
- Core: diagram format and validator, pure stepper, pure edit operations, four sample diagrams.
- Server: file store, CRUD, import and export API, `demo-health/1`, doctor, Host and Origin guards.
- Web: React Flow canvas with movable boxes, Simulate, Pause, Resume, Prev, Next, Reset, speed, edit, save a copy, export, import.
- Content pack, shelf entry, Docker and compose (loopback publish pinned by a test), CI.
