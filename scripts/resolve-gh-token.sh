#!/bin/bash
# resolve-gh-token.sh — print a GitHub token that actually works, or nothing.
set -uo pipefail

PROBE_TIMEOUT="${GH_TOKEN_PROBE_TIMEOUT:-5}"

gh_bounded() {
    if command -v timeout >/dev/null 2>&1; then
        timeout "$PROBE_TIMEOUT" "$@"
    else
        "$@"
    fi
}

probe() {
    local candidate="$1"
    [ -n "$candidate" ] || return 1
    GH_TOKEN="$candidate" GITHUB_TOKEN="$candidate" \
        gh_bounded gh api user -q .login >/dev/null 2>&1
}

emit_check() {
    local found
    found=""
    for candidate in "${GH_TOKEN:-}" "${GITHUB_TOKEN:-}"; do
        if probe "$candidate"; then
            found="$candidate"
            break
        fi
    done
    if [ -z "$found" ] && [ -n "${GH_TOKEN:-}" -o -n "${GITHUB_TOKEN:-}" ]; then
        echo "[gh-token] exported token is stale or invalid; ignoring it" >&2
    fi
    # Fall back to the gh credential store (the `gh auth login` case) whenever
    # nothing valid was exported — including when an exported token is stale.
    # Mirrors the plain-path behavior below.
    if [ -z "$found" ]; then
        found="$(env -u GH_TOKEN -u GITHUB_TOKEN gh auth token 2>/dev/null || true)"
        if [ -n "$found" ]; then
            if probe "$found"; then
                echo "[gh-token] using token from gh credential store (validated)" >&2
            else
                found=""
                echo "[gh-token] gh credential store token is invalid" >&2
            fi
        fi
    fi
    if [ -z "$found" ]; then
        echo "[gh-token] no valid token found; gh will be unauthenticated" >&2
        exit 0
    fi
    exit 0
}

if [[ "${1:-}" == "--check" ]]; then
    emit_check
    exit 0
fi

for candidate in "${GH_TOKEN:-}" "${GITHUB_TOKEN:-}"; do
    if probe "$candidate"; then
        printf '%s' "$candidate"
        exit 0
    fi
done
[ -n "${GH_TOKEN:-}" ] && echo "[gh-token] exported GH_TOKEN is stale or invalid; ignoring it" >&2

found="$(env -u GH_TOKEN -u GITHUB_TOKEN gh auth token 2>/dev/null || true)"
if [ -n "$found" ] && probe "$found"; then
    printf '%s' "$found"
    exit 0
fi

exit 0
