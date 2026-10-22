#!/usr/bin/env bash
# Renders k8s/diagram-studio.yaml and (only with --apply) applies it. Default is a DRY RUN that prints what would be applied.
#   IMAGE=ghcr.io/<owner>/diagram-studio:<tag>  SE_HOST=<host clients use>  NAMESPACE=<ns>  k8s/deploy.sh [--apply]
# No namespace default: which namespace the SE cluster uses is an owner decision. The first deploy of an app is owner-approved.
# Placeholders are replaced with sed (no envsubst); the script fails if any __TOKEN__ is left unreplaced.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
manifest="${MANIFEST:-$here/diagram-studio.yaml}"
apply=0; [ "${1:-}" = "--apply" ] && apply=1

: "${IMAGE:?set IMAGE (the image reference to run)}"
: "${SE_HOST:?set SE_HOST (the host name clients use)}"
: "${NAMESPACE:?set NAMESPACE (no default; an owner decision)}"
[[ "$NAMESPACE" =~ ^[a-z0-9]([-a-z0-9]*[a-z0-9])?$ ]] || { echo "NAMESPACE is not a valid namespace name" >&2; exit 1; }
[[ "$SE_HOST" =~ ^[A-Za-z0-9]([-A-Za-z0-9.]*[A-Za-z0-9])?(:[0-9]{1,5})?$ ]] || { echo "SE_HOST must be a plain host name (optionally :port)" >&2; exit 1; }
[[ "$IMAGE" =~ ^[A-Za-z0-9._/:@-]+$ ]] || { echo "IMAGE has characters an image reference cannot have" >&2; exit 1; }
case "$SE_HOST$IMAGE" in *'|'*|*'&'*|*'\'*) echo "unsafe character in IMAGE or SE_HOST" >&2; exit 1;; esac

rendered="$(sed -e "s|__IMAGE__|$IMAGE|g" -e "s|__SE_HOST__|$SE_HOST|g" "$manifest")"
if left="$(printf '%s\n' "$rendered" | grep -oE '__[A-Z0-9_]+__' | sort -u)" && [ -n "$left" ]; then
  echo "unreplaced placeholders left: $(echo "$left" | tr '\n' ' ')" >&2; exit 1
fi

if [ "$apply" = "1" ]; then
  printf '%s\n' "$rendered" | kubectl apply -n "$NAMESPACE" -f -
  kubectl rollout status -n "$NAMESPACE" deployment/diagram-studio --timeout=120s
else
  echo "# DRY RUN: would apply to namespace $NAMESPACE (add --apply to apply)"
  printf '%s\n' "$rendered"
fi
