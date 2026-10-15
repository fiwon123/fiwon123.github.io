#!/bin/bash
set -euo pipefail

# setup-host-tools.sh — host bootstrap for the dev sandbox
#
# Installs/activates mise and authenticates gh as needed. Everything the sandbox
# expects at runtime (the gh config dir, the opencode binary, ~/.gitconfig) is
# created here so a fresh machine can reach `make dev-up` in one command.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ "${1:-}" != "--no-gh" ]]; then
    if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
        echo "[tools] gh CLI not authenticated — starting login (device flow)..."
        gh auth login
    else
        echo "[tools] gh CLI already authenticated."
    fi
fi

if ! command -v mise >/dev/null 2>&1; then
    echo "[tools] Installing mise (to ~/.local/bin via mise.run)..."
    curl -fsSL https://mise.run | sh
fi

if ! grep -qs 'mise activate' ~/.bashrc 2>/dev/null; then
    echo 'eval "$(mise activate bash)"' >> ~/.bashrc
    echo "[tools] Added mise activation to ~/.bashrc"
fi
eval "$(mise activate bash)" 2>/dev/null || true

echo "[tools] Installing the project toolchain from mise.toml..."
(cd "$ROOT_DIR" && mise install)

# The sandbox mounts these read-only; a missing path makes Docker create a
# root-owned *directory* in its place, which then breaks the mount on the next
# run. Create them on the host first (the Makefile's preflight does the same).
mkdir -p "$HOME/.config/opencode" "$HOME/.config/gh"
[ -f "$HOME/.gitconfig" ] || touch "$HOME/.gitconfig"

if [ ! -x "$HOME/.opencode/bin/opencode" ]; then
    echo "[tools] opencode not found at ~/.opencode/bin/opencode."
    echo "[tools] Install it (https://opencode.ai/install) so the sandbox can mount it."
fi

echo "=== Host toolchain ready ==="
