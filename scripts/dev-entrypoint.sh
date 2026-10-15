#!/bin/bash
set -euo pipefail

# Dev sandbox entrypoint — install dependencies if needed, then start the Vite
# dev server bound to 0.0.0.0 so the published port is reachable from the host.

DEV_DIR="${DEV_DIR:-/workspace}"
VITE_PORT="${VITE_PORT:-5173}"

# --- Passwd entry for the runtime user ---------------------------------------
# `docker compose up` can start this before any interactive shell, so a missing
# passwd entry surfaces here first, as npm failing on an unwritable HOME.
if ! getent passwd "$(id -u)" >/dev/null; then
    if [[ "$(id -u)" -eq 0 ]]; then
        echo "[dev] UID 0 has no passwd entry — adding a fallback identity."
        printf 'sandbox:x:%s:%s:Sandbox User:/home/%s:/bin/bash\n' \
            "$(id -u)" "$(id -g)" "${DEV_USER:-devuser}" >> /etc/passwd
    else
        echo "[dev] WARNING: UID $(id -u) has no passwd entry." >&2
    fi
fi

cd "${DEV_DIR}"

if [ ! -d node_modules ]; then
    echo "[dev] no node_modules — installing from the lockfile (npm ci)..."
    npm ci
fi

echo "[dev] starting the Vite dev server on http://0.0.0.0:${VITE_PORT}"
exec npm run dev -- --host 0.0.0.0 --port "${VITE_PORT}"
