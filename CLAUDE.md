# Diagram Studio (tier: Tool)

A local, offline studio for flow diagrams stored as data (`diagram-studio/1` JSON): pick or edit a diagram, drag boxes, Simulate, Reset, speed, undo/redo,
Tidy, step and story editor, presenter mode, embed view, and export as JSON, SVG, PNG or one self-contained HTML file. Other standalone apps draw their
diagrams from this data (rule 17). Express API + React Flow web app, npm workspaces: `core` (pure logic, no DOM), `server`, `web`.

## Run and test
- `npm install`, `npm run build` (web/dist), `npm start` -> http://127.0.0.1:6001 (dev: `npm run dev`, API 6001, Vite 6002). `npm run doctor` = preflight.
- `npm test` = core + server + web + content-pack + compose + k8s checks. It must pass with NO web build present (CI runs tests before build); server tests use a stand-in web dir.
- `npm run e2e` drives the built app in real Chromium (needs `npm run build` first; uses E2E_PORT, default 6043, and port 6049 for its own host page).
- `npm run content-pack` regenerates `content-pack.json` and `content/stories/*.json`; a test fails if they are stale.
- Use `node --test <files or a glob>`, never a directory. Use exit codes, not parsed `node:test` output (Node 22 prints TAP when piped).

## Rules that bite
- Ports 60xx-64xx only (6001 app, 6002 dev). Never 8080, 5173, 3900, 4000, 4400, 4510, 4600-4601, 18080/19080/19090.
- No identifiers from other projects in shipped content: only `.example` / `.invalid` hosts, no client ids, tenant ids, real email domains or internal service names.
  `core/test/hygiene.test.js` scans every diagram, story and template. History scan must print 0: `git log -p --all | grep -cF -f ~/.config/demo-kit/forbidden-strings.txt` (never print the list).
- Loopback-only bind, Host check (421), same-origin writes (Origin check), Docker publishes `127.0.0.1:` only (tested). Only `/?embed=1` may be framed, and only from loopback origins.
- All diagram text is rendered inert (React text, XML-escaped SVG, JSON read with textContent). Never use `innerHTML`, `eval`, `Function`.
- `MOCK_ONLY=1` (or `MODE=mock`) = hosted read-only mock: every API write is refused with 403 `mock_only`.
- Every diagram needs movable boxes, Simulate, Reset (restores positions) and a speed control; ReactFlow only, never mermaid.
- Browser checks: prove UI changes with `npm run e2e` or Playwright before handing over; a 200 is not proof.
- Commits end with the Co-Authored-By line; PRs end with the Claude Code line; one writer per branch; merge your own PRs after real CI green.
