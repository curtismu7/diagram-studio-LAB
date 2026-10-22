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

## Undo, Tidy and new diagrams

- **Undo / Redo** (buttons, or Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z, also Ctrl+Y) step through your edits, up to 100. Dragging a box is one step however long the drag is.
  The shortcuts are ignored while you are in a text field or presenting. Typing in a field is one undo step per visit to the field (it settles when you leave it), not one per letter. Opening another diagram starts a fresh history.
- **Tidy** lays the boxes out in columns by arrow direction (left to right; a long run of columns is folded into rows), with no overlapping boxes (sizes are estimated from the text).
  Back arrows of a loop are ignored for the layering. It is meant for messy layouts: imported, new, or tangled diagrams. On a diagram you arranged by hand it can be worse
  (more arrows crossing boxes, smaller text), so look at it and **Undo** if you prefer the old layout. Tidy is one undo step, **Reset** still goes back to the layout you
  opened or last saved, and a 60-box chain or fan is too big to read on one screen however it is laid out.
- **New diagram** starts from a template (blank, client and server, request held for approval), a title you type (Enter creates it, Escape closes the panel; no title means "New diagram"), and an id made from it
  (a number is added if it is taken). It is saved right away, so it is listed and opens like any other.

## Export for decks

**Export SVG** and **Export PNG** draw the diagram you see: current box positions, light or dark to match the page, and the focused arrow
highlighted if a walkthrough is on. The picture is built from the diagram data (boxes sized from their text), so it is close to, not
pixel-identical with, the screen. Arrows bend around boxes in their way, parallel and reverse arrows fan out, and each arrow label is
placed where it touches no box and no other label (a narrower, taller label when the gap is small). Across the 35 built-in diagrams a test
pins the few collisions that remain in the busiest ones (ciba-link, davinci-lifecycle). The PNG is the SVG at 2x, smaller for very large
diagrams; past 8192 px the app says so and you export SVG instead. An invalid diagram is not exported; the editor shows why.

## Embed in a demo page

```html
<iframe title="Token exchange" width="900" height="560"
  src="http://127.0.0.1:6001/?embed=1&d=token-exchange&theme=light&speed=slow&autoplay=1&panel=1"></iframe>
```

`/?embed=1&d=<diagram id>` shows only the canvas and the walkthrough controls (Simulate, Pause, Resume, Prev, Next, Reset, Speed) and an
"Open in studio" link. It has no editing, saving, diagram picker or browser storage, so an embed never changes anything. Boxes can still be
dragged (in memory; Reset puts them back). Options: `theme=light|dark`, `speed=slow|normal|fast`, `autoplay=1` (start playing on load),
`panel=1` (show the current step, with its story and hop, under the canvas). Other values are ignored; a repeated parameter uses its first value; `d` is case-sensitive and, if missing, the first diagram is shown; only exactly one `embed=1` selects the embed view (`embed=true`, `embed=0` or a repeated `embed` show the full studio). Frames as small as about 300x200 stay usable (the toolbar scrolls sideways and the diagram keeps the rest); if the studio cannot be reached or the diagram is missing you get a message and an "Open the studio" link.

Only this URL may be framed, and only by a page on `http://localhost:*` or `http://127.0.0.1:*` (the Content-Security-Policy
`frame-ancestors` list; the browser also lets `https://localhost` and `https://127.0.0.1` match, which is harmless on loopback). The full studio and the API refuse framing, and every other response also sends `X-Frame-Options: DENY`. An IPv6 origin cannot be allowed: browsers reject it in that directive.

**Save as HTML** writes one self-contained file: the overview and one picture per arrow are baked in, with Play, Pause, Prev, Next, Reset, a speed
control and the current step (with its story line and trace hop). It needs no server, no network and no library, so you can email it or open it
offline. It is a snapshot (boxes do not move there; open the studio to edit). A wide diagram can be hard to read when fitted to a narrow screen: **Actual size** shows it at its real size and scrolls (on phones it also keeps a minimum width). Printing or saving as PDF prints the picture currently shown, so step to the arrow you want first. A diagram near the size limits makes a very large file (the app says so above 5 MB); Export SVG or PNG for a single picture. Its Content-Security-Policy allows nothing but its own inline style and script.

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

## SE cluster mock build

The hosted mock is the same image with `MODE=mock` (or `MOCK_ONLY=1`, see above): read-only, nothing stored. `k8s/diagram-studio.yaml` is a hardened Deployment
(non-root, read-only root filesystem, dropped capabilities, resource limits, a `/tmp` emptyDir, `/api/health` probes that send `Host: localhost` because the Host guard
answers 421 to a pod IP), plus a Service and an Ingress. `k8s/deploy.sh` renders the `__IMAGE__` and `__SE_HOST__` placeholders with sed and fails if any token is left;
it needs `IMAGE`, `SE_HOST` and `NAMESPACE` (no default: that is an owner decision) and is a dry run unless you pass `--apply`.

```
IMAGE=<registry>/diagram-studio:<tag> SE_HOST=<host> NAMESPACE=<ns> k8s/deploy.sh          # prints what it would apply
IMAGE=... SE_HOST=... NAMESPACE=... k8s/deploy.sh --apply                                  # owner-approved first deploy
```

Not deployed yet: the first deploy to the SE cluster needs the owner's approval, and the image has not been pushed. After a deploy, verify by content (the health response says
`"mode":"mock-only"`, a write returns 403), then add the SE URL to the shelf entry.

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
