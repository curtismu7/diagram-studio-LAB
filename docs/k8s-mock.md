# SE k8s mock deployment (rule 18b)

The mock-only build of diagram-studio runs on the US SE cluster behind the existing sign-in wall, at a path on the main host:

    https://ai-demo.ping-devops.com/mock/diagram-studio/

This page is the reusable pattern. Sibling apps (learning-hub, mcp-tools, hostile-mcp, attack-gallery) copy `k8s/`, `scripts/deploy-k8s.sh` and this page, and change only the items in "What changes per app".

## Pattern

| Piece | Value |
| --- | --- |
| Namespace | `ping-devops-cmuir` (passed as `NAMESPACE`, no default in the script) |
| Ingress class | `nginx-public`, host `ai-demo.ping-devops.com`, path `/mock/<app>(/\|$)(.*)` (`ImplementationSpecific`) |
| Prefix handling | `use-regex: "true"` and `rewrite-target: /$2`, so the app sees plain paths (`/`, `/api/health`) |
| Bare path | A second Ingress, `Exact` `/mock/<app>`, with `permanent-redirect` (308) to `https://<host>/mock/<app>/` |
| Sign-in wall | `auth-url`, `auth-signin` and `ssl-redirect` copied from `ai-demo-grafana-authed-ingress` (host and namespace are tokens). No `tls:` stanza, same as that ingress |
| Image | `ghcr.io/cmuir_pingcorp/<app>-mock:<12-char git sha>`; never `:latest`; pull secret `ghcr-pull-secret` |
| Pod | 1 replica, non-root (uid 1000), `readOnlyRootFilesystem`, `emptyDir` on `/tmp`, drop ALL, no privilege escalation, seccomp RuntimeDefault, 25m/64Mi requests, 250m/256Mi limits, no service account token |
| Labels | `app.kubernetes.io/name=<app>-mock`, `app.kubernetes.io/part-of=standalone-mock` |
| NetworkPolicy | None added. `ai-demo-internal` selects every pod whose `component` label is not `mcp-server` (an unlabelled pod matches) and allows ingress from namespace `ingress-nginx-public` pods with role `ingress-nginx-public`. Do not give the pod `component: mcp-server` |

### The app must work under a prefix

- Vite `base: "./"`, so `index.html` references `./assets/...`.
- Every client fetch is relative (`fetch("api/health")`, no leading slash). The page URL ends in `/`, so these resolve under the prefix.
- The server does no redirects of its own; the bare-path redirect lives in the second Ingress.
- Tests: `web/src/api.test.js` (API URLs have no leading slash) and `scripts/prefix.test.mjs` (a real build has only relative asset URLs).

### Host guard and probes

The app answers 421 to any `Host` it does not expect, including the kubelet's pod-IP Host. So:

- `STUDIO_ALLOW_HOST=__SE_HOST__` (one exact extra Host; ingress-nginx forwards the client Host unchanged).
- Readiness and liveness probes are `httpGet /api/health` with `httpHeaders: Host: __SE_HOST__`.

### Placeholders

The manifest uses literal tokens, replaced by `sed` in the deploy script; any token left over aborts. `__IMAGE__`, `__SE_HOST__`, `__NAMESPACE__` (used only in the cluster-internal `auth-url`). The manifest has no `namespace:`.

## Deploy

From a clean checkout whose HEAD is pushed (the script refuses otherwise):

    NAMESPACE=ping-devops-cmuir scripts/deploy-k8s.sh

Steps: buildx `linux/amd64` build and push of the sha tag, check the GHCR manifest digest equals the pushed digest, render and `kubectl apply`, wait for rollout, then verify by content inside the pod:

- `/api/health` contains `"mode":"mock-only"`;
- the served `index.html` references `./assets/` and has no absolute `src="/` or `href="/`;
- a `PUT` answers 403 `mock_only`;
- the pod `imageID` contains the pushed digest.

The public URL is behind the wall, so a 200 there proves nothing; open it in a signed-in browser as the final check.

Rehearse without touching anything: `NAMESPACE=ping-devops-cmuir scripts/deploy-k8s.sh --dry-run` builds locally (no push), runs `kubectl apply --dry-run=server`, prints the rendered manifest and what each real step would do. Failed preconditions print `WOULD REFUSE`.

## Rollback

    kubectl rollout undo -n ping-devops-cmuir deploy/<app>-mock
    kubectl rollout status -n ping-devops-cmuir deploy/<app>-mock

Remove the app: `kubectl delete -n ping-devops-cmuir deploy,svc,ingress -l app.kubernetes.io/name=<app>-mock`.

## Verify locally without a cluster

Run the image with the hosting env on a Docker network, put nginx in front with `location ~ ^/mock/<app>(/|$)(.*) { rewrite ^/mock/<app>(/|$)(.*)$ /$2 break; proxy_pass http://<app>:<port>; proxy_set_header Host $http_host; }`, point a browser at a name that resolves to 127.0.0.1 (Chromium `--host-resolver-rules`) and set the allowed Host to that name with its port. Check: assets and API return 200 under the prefix, banner shows, writes return 403 `mock_only`.

## What changes per app

| Item | diagram-studio | Per sibling |
| --- | --- | --- |
| App name / path / image | `diagram-studio`, `/mock/diagram-studio/`, `diagram-studio-mock` | `<app>`, `/mock/<app>/`, `<app>-mock` |
| Mock switch | `MOCK_ONLY=1` | the app's own switch |
| Bind env | `STUDIO_BIND=0.0.0.0` | the app's bind variable |
| Allowed-host env | `STUDIO_ALLOW_HOST` | the app's variable (one exact Host); if the app has none, add one before deploying |
| Port | `PORT=6001` | the app's port (container, Service, probes) |
| Health path | `/api/health` | the app's (`demo-health/1` path) |
| Writable dir | `DATA_DIR=/tmp/studio` on the `emptyDir` | wherever the app writes |
| In-pod content checks | `wget`/`node` against `127.0.0.1:6001` | same idea, app port, the app's own mock markers |
| Prefix safety | relative Vite base and fetches | same; any server-built absolute link (redirects, `Location`, HTML with `/x`) must be made relative |

## Not verified from a laptop

- That the wall's `auth-url`/`auth-signin` work for a path prefix (they only see the request URI; `return_to` carries the prefix) is expected, not proven until the first deploy.
- `use-regex` in ingress-nginx applies to all paths of a host across Ingresses; `llm-gw-ingress` already sets it on this host, so the behaviour is not new.
