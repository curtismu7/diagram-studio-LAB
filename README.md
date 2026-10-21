# Diagram Studio

A small offline studio for flow diagrams stored as data. Pick a built-in sample (or one you saved), drag the boxes, press
**Simulate** to walk the arrows in order, **Pause / Resume / Prev / Next**, change the **Speed**, **Reset**, edit boxes and
arrows, **Save a copy**, and **Export** or **Import** the diagram as a JSON file. Diagrams are drawn with React Flow.

It needs no tenant and makes no outbound network request. The server listens on `127.0.0.1` only (port 6001).

## Run

```
npm install
npm run build        # builds web/dist, which the server serves
npm start            # http://127.0.0.1:6001
npm run doctor       # preflight: node version, bind, samples valid, data dir writable, port free
```

Or with Docker (OrbStack): `HOST_PORT=6001 docker compose up --build -d`. The port is published on `127.0.0.1` only
(a test pins this); saved diagrams live in the `studio-data` volume.

Development: `npm run dev` (API on 6001, Vite on 6002).

## What you can do

- 35 built-in diagrams (4 hand-written basics + 31 converted from a larger demo, see `docs/library.md`) are read-only. **Save a copy** makes your own, stored as `.data/diagrams/<id>.json` (or `DATA_DIR`).
- **Edit** mode also opens a details editor: title and intro, groups (name, colour, add, remove when unused), and steps (title, what, why it matters, trace hop, story link, which arrows each covers, reorder, delete). A box's group and small print are edited when you select it (the small print box keeps what you type; the diagram gets the tidied lines, up to six). Deleting a box or arrow never deletes a step: a step left with no arrows keeps its text and is flagged as never highlighting. The arrow checklist scrolls when a diagram has many arrows. A problem list appears if something is invalid, and Save stays off until it is fixed.
- **Edit** mode: Add box, click a box or arrow to rename or delete it, drag from a box's right dot to another's left dot to add an arrow.
- **Reset** stops the walkthrough and puts every box back where it was when you opened or last saved the diagram. It keeps your edits.
- **Export JSON** downloads the diagram you see (including unsaved edits). **Import JSON** checks the file and saves it as a new diagram;
  an id that already exists is refused.

## Export for decks

**Export SVG** and **Export PNG** draw the diagram you see: current box positions, light or dark to match the page, and the focused arrow
highlighted if a walkthrough is on. The picture is built from the diagram data (boxes sized from their text), so it is close to, not
pixel-identical with, the screen. Arrows bend around boxes in their way, parallel and reverse arrows fan out, and each arrow label is
placed where it touches no box and no other label (a narrower, taller label when the gap is small). Across the 35 built-in diagrams a test
pins the few collisions that remain in the busiest ones (ciba-link, davinci-lifecycle). The PNG is the SVG at 2x, smaller for very large
diagrams; past 8192 px the app says so and you export SVG instead. An invalid diagram is not exported; the editor shows why.

## Presenter mode

**Present** (or `?present=1`) enlarges the type and canvas, hides the edit and file controls, and shows the current step in a big panel.
Keys: Space plays or pauses, ← → (or Page Up/Down, handy with a clicker) step (Right starts the walkthrough), R resets, 1 2 3 set slow, normal, fast, Esc exits.
Keys are ignored while you type in a text field, and Space on a focused button presses that button; Esc works from the diagram picker too. The choice is remembered in this browser; `?present=1` or `?present=0` sets it on load and is then removed from the address bar.
Page Up/Down are taken over for stepping while presenting, so they do not scroll the page.

## Diagram format (`diagram-studio/1`)

```json
{ "schema": "diagram-studio/1", "id": "my-flow", "title": "My flow", "lede": "optional",
  "groups": { "app": { "label": "Apps", "color": "dark" } },
  "nodes": [{ "id": "a", "group": "app", "label": "A", "sub": ["optional lines"], "x": 0, "y": 0 }],
  "edges": [{ "source": "a", "target": "b", "label": "optional", "dashed": false }],
  "steps": [{ "title": "Start", "what": "text", "why": "optional", "edges": [0] }] }
```

Optional step links: `"story": { "id": "S01", "step": 2 }` points at a story step and `"hop": "token"` names a trace hop (letters, digits `. _ : / -`, up to 64).
The studio ships four stories (`content/stories/`, same shape as the demo family's story files); a step card shows the story step's
Say, Tell and Why. A story id the studio does not ship (say, one from another demo) is shown as a plain label. The content pack lists the four stories.

Colors: red, dark, grey, blue, green, amber. Limits: 60 boxes, 120 arrows, 60 steps, 8 groups. Anything else is refused with the reason.
All text is shown as plain text, never as HTML.

## Hosting the mock

A hosted copy is read-only sample data: `MOCK_ONLY=1` refuses every API write with 403 `mock_only`, hides Save, Save a copy, Import and Delete,
shows a banner, and keeps its working files in a throwaway temp directory. Defaults stay loopback-only; a cluster copy opts in explicitly:

| Variable | Value | Why |
| --- | --- | --- |
| `MOCK_ONLY` | `1` | read-only hosted mock |
| `STUDIO_BIND` | `0.0.0.0` | listen beyond loopback (the Docker image already sets this) |
| `STUDIO_ALLOW_HOST` | the exact `Host` header clients send, e.g. `mock.example.com` (include `:port` if non-standard) | the DNS-rebinding guard answers 421 `bad_host` to every other host |
| `PORT` | `6001` (default) | listen port |

- Readiness probe: `GET /api/health` returns 200 with `"state":"ready"` and `"mode":"mock-only"`.
- With a read-only root filesystem, mount a writable `/tmp` (an `emptyDir` in Kubernetes); the image runs as the non-root `node` user.
- Do not bake a `.env` into an image: `.dockerignore` excludes it, and the server would load it at start. Pass settings as container environment.

## Checks

- `npm test` runs core, server and web unit tests plus the content-pack and compose checks.
- `npm run e2e` drives the built app in a real Chromium (Playwright): pick, simulate, pause, speed, drag, reset, edit, save a copy,
  reload, export, bad import, delete, dark mode, phone width, and that no request leaves the origin.
- `GET /api/health` answers `demo-health/1` for the demo shelf. `docs/shelf-entry.json` is the shelf entry.
- `content-pack.json` is the Learning Hub content pack; regenerate with `npm run content-pack`.

## Notes and limits

- No sign-in: it is a local tool. The server refuses non-loopback `Host` headers and cross-origin writes. Setting `STUDIO_BIND`
  (the Docker image does) lets it listen on other interfaces; then keep the publish on loopback.
- The samples are generic teaching flows with fictional names.
- Not covered: multi-user editing (last save wins), undo, touch-drag tuning on phones.
