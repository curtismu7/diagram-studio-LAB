#!/usr/bin/env bash
# Build, push and deploy the diagram-studio MOCK-ONLY image to the SE k8s cluster. See docs/k8s-mock.md.
#
#   NAMESPACE=ping-devops-cmuir scripts/deploy-k8s.sh             real deploy (owner-approved first deploy)
#   NAMESPACE=ping-devops-cmuir scripts/deploy-k8s.sh --dry-run   local build only, no push, kubectl apply --dry-run=server
#
# Env: NAMESPACE (required, no default), SE_HOST (default ai-demo.ping-devops.com), REGISTRY (default ghcr.io/cmuir_pingcorp),
#      KUBE_CONTEXT (optional), IMAGE_NAME (default diagram-studio-mock).
# Docker must be OrbStack (context "orbstack"), never Docker Desktop.
set -euo pipefail

DRY=0
case "${1:-}" in
  --dry-run) DRY=1 ;;
  "") ;;
  *) echo "usage: NAMESPACE=<ns> $0 [--dry-run]" >&2; exit 2 ;;
esac

: "${NAMESPACE:?NAMESPACE is required (the SE namespace is an owner decision; no default)}"
SE_HOST="${SE_HOST:-ai-demo.ping-devops.com}"
REGISTRY="${REGISTRY:-ghcr.io/cmuir_pingcorp}"
IMAGE_NAME="${IMAGE_NAME:-diagram-studio-mock}"
NAME=diagram-studio-mock
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
KUBECTL=(kubectl); [ -n "${KUBE_CONTEXT:-}" ] && KUBECTL+=(--context "$KUBE_CONTEXT")
SHA="$(git rev-parse --short=12 HEAD)"
IMAGE="$REGISTRY/$IMAGE_NAME:$SHA"
RENDERED="$(mktemp -t diagram-studio-mock.XXXXXX)"
trap 'rm -f "$RENDERED"' EXIT
say() { printf '%s\n' "$*"; }
fail() { say "ERROR: $*" >&2; exit 1; }
# In a dry run a failed precondition is reported ("WOULD REFUSE") instead of stopping, so the plan still prints.
guard() { if [ "$DRY" = 1 ]; then say "WOULD REFUSE: $*"; else fail "$*"; fi; }

[ "$(docker context show)" = "orbstack" ] || fail "docker context must be orbstack (OrbStack, not Docker Desktop)"

say "== diagram-studio mock deploy ($([ $DRY = 1 ] && echo DRY RUN || echo REAL))"
say "   image      $IMAGE"
say "   namespace  $NAMESPACE"
say "   host       https://$SE_HOST/mock/diagram-studio/"

# 1. Preconditions: clean tree, HEAD pushed.
[ -z "$(git status --porcelain)" ] || guard "git tree is not clean"
git fetch -q origin || guard "cannot fetch origin"
[ -n "$(git branch -r --contains HEAD 2>/dev/null)" ] || guard "HEAD $SHA is not pushed to origin"

# 2. Render manifest: literal __TOKEN__ placeholders, replaced with sed; any left over is an error.
sed -e "s|__IMAGE__|$IMAGE|g" -e "s|__SE_HOST__|$SE_HOST|g" -e "s|__NAMESPACE__|$NAMESPACE|g" k8s/diagram-studio-mock.yaml > "$RENDERED"
if grep -nE '__[A-Z_]+__' "$RENDERED"; then fail "unreplaced __TOKEN__ in rendered manifest"; fi

# 3. Build (linux/amd64: the SE nodes are amd64).
if [ "$DRY" = 1 ]; then
  say "-- would run: docker buildx build --platform linux/amd64,linux/arm64 -t $IMAGE --push .   (dry run: building locally with --load, no push)"
  docker buildx build --platform linux/amd64 -t "$IMAGE" --load .
  say "-- would run: docker buildx imagetools inspect $IMAGE   (verify pushed manifest)"
  say "-- would run: kubectl apply -n $NAMESPACE -f <rendered>   (dry run: --dry-run=server)"
  "${KUBECTL[@]}" apply -n "$NAMESPACE" --dry-run=server -f "$RENDERED"
  say "-- would run: kubectl rollout status deploy/$NAME; then verify by content inside the pod:"
  say "     GET /api/health has \"mode\":\"mock-only\"; index.html references ./assets/ only; PUT /api/diagrams/x answers 403 mock_only;"
  say "     pod imageID digest equals the pushed digest"
  say "DRY RUN OK: nothing was pushed or changed. Rendered manifest follows."
  say "-----"; cat "$RENDERED"
  exit 0
fi

META="$(mktemp -t diagram-studio-meta.XXXXXX)"; trap 'rm -f "$RENDERED" "$META"' EXIT
docker buildx build --platform linux/amd64,linux/arm64 -t "$IMAGE" --push --metadata-file "$META" .
DIGEST="$(sed -n 's/.*"containerimage.digest": *"\(sha256:[0-9a-f]*\)".*/\1/p' "$META" | head -1)"
[ -n "$DIGEST" ] || fail "could not read the pushed digest from build metadata"

# 4. Verify the GHCR manifest exists and matches the pushed digest.
REMOTE="$(docker buildx imagetools inspect "$IMAGE" | sed -n 's/^Digest: *//p' | head -1)"
[ "$REMOTE" = "$DIGEST" ] || fail "GHCR manifest digest ($REMOTE) does not match pushed digest ($DIGEST)"
say "GHCR manifest ok: $IMAGE @ $DIGEST"

# 5. Apply and wait.
"${KUBECTL[@]}" apply -n "$NAMESPACE" -f "$RENDERED"
"${KUBECTL[@]}" rollout status -n "$NAMESPACE" "deploy/$NAME" --timeout=180s

# 6. Verify by content inside the pod (the public URL is behind the sign-in wall).
exec_in() { "${KUBECTL[@]}" exec -n "$NAMESPACE" "deploy/$NAME" -- "$@"; }
HEALTH="$(exec_in wget -qO- --header "Host: $SE_HOST" http://127.0.0.1:6001/api/health)"
say "health: $HEALTH"
case "$HEALTH" in *'"mode":"mock-only"'*) ;; *) fail "health does not report mode mock-only" ;; esac
INDEX="$(exec_in wget -qO- --header "Host: $SE_HOST" http://127.0.0.1:6001/)"
case "$INDEX" in *'./assets/'*) ;; *) fail "index.html does not reference ./assets/ (not prefix-safe)" ;; esac
case "$INDEX" in *'src="/'*|*'href="/'*) fail "index.html has an absolute asset URL" ;; esac
CODE="$(exec_in node -e 'fetch("http://127.0.0.1:6001/api/diagrams/probe",{method:"PUT",headers:{Host:process.argv[1],"Content-Type":"application/json"},body:"{}"}).then(async r=>console.log(r.status,(await r.text()).includes("mock_only")))' "$SE_HOST")"
[ "$CODE" = "403 true" ] || fail "write probe expected '403 true', got '$CODE'"
say "content ok: mock-only health, relative assets, writes refused"

# 7. The running pod must be the image we pushed.
IMAGE_ID="$("${KUBECTL[@]}" get pods -n "$NAMESPACE" -l app.kubernetes.io/name=$NAME -o jsonpath='{.items[0].status.containerStatuses[0].imageID}')"
case "$IMAGE_ID" in *"$DIGEST"*) say "pod imageID matches pushed digest: $IMAGE_ID" ;; *) fail "pod imageID ($IMAGE_ID) does not contain pushed digest ($DIGEST)" ;; esac
say "DONE. Open https://$SE_HOST/mock/diagram-studio/ (sign in first). Rollback: kubectl rollout undo -n $NAMESPACE deploy/$NAME"
