#!/bin/bash
set -euo pipefail

# ensure-sandbox-running.sh — bring the dev sandbox up without gratuitously rebuilding
#
# Three cases:
#   1. Never initialized (no `dev` container) -> up -d --build
#   2. Exists but not running -> up -d (no rebuild)
#   3. Already running -> do nothing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE="${COMPOSE:-docker compose}"
DEV_SERVICE="${SANDBOX_DEV_SERVICE:-dev}"
HOST_HOME="${HOST_HOME:-$HOME}"
export HOST_HOME
export HOST_UID="${HOST_UID:-$(id -u)}"
export HOST_GID="${HOST_GID:-$(id -g)}"

log() { echo "[sandbox] $*" >&2; }

service_state() {
    local service="$1" state
    state="$($COMPOSE ps --all --format '{{.State}}' "$service" 2>/dev/null | head -n 1 || true)"
    printf '%s' "$state"
}

# The GitHub token only ever lives in the host environment; forwarding it here
# means `sh`-based helpers get it too, not just the Makefile targets.
if [ -z "${GH_TOKEN:-}" ] && [ -z "${GITHUB_TOKEN:-}" ]; then
    token="$("$SCRIPT_DIR/resolve-gh-token.sh" 2>/dev/null || true)"
    if [ -n "$token" ]; then
        export GH_TOKEN="$token" GITHUB_TOKEN="$token"
    fi
fi

state="$(service_state "$DEV_SERVICE")"

if [ -z "$state" ]; then
    log "never initialized; starting dev with build"
    $COMPOSE up -d --build "$DEV_SERVICE"
else
    case "$state" in
        running)
            log "already running"
            ;;
        *)
            log "exists ($state); starting"
            $COMPOSE up -d "$DEV_SERVICE"
            ;;
    esac
fi
