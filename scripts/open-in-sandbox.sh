#!/bin/bash
set -euo pipefail

# open-in-sandbox.sh — interactive shell inside the dev sandbox
#
# Ensures the stack is running, then opens a shell in the `dev` container.
# The GitHub token is forwarded at runtime via compose environment interpolation.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE="${COMPOSE:-docker compose}"
HOST_HOME="${HOST_HOME:-$HOME}"
HOST_PROJECT_DIR="${HOST_PROJECT_DIR:-$ROOT_DIR}"

workspace_uid="$(stat -c '%u' "$ROOT_DIR" 2>/dev/null || stat -f '%u' "$ROOT_DIR" 2>/dev/null || id -u)"
workspace_gid="$(stat -c '%g' "$ROOT_DIR" 2>/dev/null || stat -f '%g' "$ROOT_DIR" 2>/dev/null || id -g)"
export HOST_UID="${HOST_UID:-$workspace_uid}"
export HOST_GID="${HOST_GID:-$workspace_gid}"
export HOST_HOME HOST_PROJECT_DIR

if [ "$HOST_UID" = "0" ]; then
    echo "ERROR: refusing to run the dev sandbox as UID 0" >&2
    exit 1
fi

"$SCRIPT_DIR/resolve-gh-token.sh" --check >/dev/null 2>&1 || true

"$SCRIPT_DIR/ensure-sandbox-running.sh" >/dev/null 2>&1 || "$COMPOSE" up -d --build dev

if [ -t 0 ]; then
    exec "$COMPOSE" exec -it dev zsh || exec "$COMPOSE" exec -it dev bash
else
    exec "$COMPOSE" exec -T dev zsh || exec "$COMPOSE" exec -T dev bash
fi
