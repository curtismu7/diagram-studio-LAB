# Safety

Diagram Studio is a local tool with no sign-in. These are the guarantees and where each is tested.

| Guarantee | How | Test |
|---|---|---|
| Listens on loopback only by default | `STUDIO_BIND` unset = `127.0.0.1`; the Docker image sets it on purpose and the compose file publishes `127.0.0.1:` only | `scripts/compose.test.mjs`, `server/test/api.test.js` (doctor) |
| DNS rebinding refused | Host header must be loopback or the one `STUDIO_ALLOW_HOST` value, else 421 | `server/test/api.test.js` |
| Cross-site writes refused | API writes with a foreign or `null` Origin get 403 | `server/test/api.test.js` |
| Framing refused, except the embed view | `X-Frame-Options: DENY` and `frame-ancestors 'none'` everywhere; `GET /?embed=1` alone allows `http://localhost:*` and `http://127.0.0.1:*` | `server/test/api.test.js` |
| No outbound requests | The server source has no network client; tests assert it. The saved HTML page has a CSP that allows nothing but its own inline style and script | `server/test/api.test.js`, `core/test/authoring.test.js`, e2e (no request leaves the origin) |
| Diagram text is inert | React text, XML escaping, JSON read with `textContent`; no `innerHTML`/`eval` | `core/test/*`, `web/src/*.test.jsx`, hostile-input reviews |
| Input is bounded | 60 boxes, 120 arrows, 60 steps, 8 groups, text length caps, 600 KB bodies, 500 KB imports, iterative layout (no recursion) | `core/test/core.test.js`, `core/test/authoring.test.js` |
| No other project's identifiers | Only `.example`/`.invalid` hosts, no ids or internal names in shipped content | `core/test/hygiene.test.js`, history scan, gitleaks |
| Hosted mock is read-only | `MOCK_ONLY=1`/`MODE=mock` refuses every write with 403 and keeps no data | `server/test/mock-only.test.js` |

Known limits: the page CSP of the saved HTML file allows inline script (it needs its own), so it blocks network and `eval` but is not an XSS defence on its own;
safety there rests on escaping. A diagram near the size limits makes a very large HTML file (the app warns above 5 MB). IPv6 origins cannot be allowed to frame the embed view.
