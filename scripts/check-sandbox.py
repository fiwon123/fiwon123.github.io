#!/usr/bin/env python3
"""Static checks for the dev sandbox configuration.

Docker is not available everywhere this repo is worked on, and the dev sandbox is
exactly the kind of file nobody runs on a normal edit: `docker compose config`
looks like inspection but would render the *interpolated* token values, and a
mistake here fails on the next `make dev-up`, not now. So these checks read the
files and assert the properties that matter, with no daemon and no network.

Every check guards a failure that is otherwise silent — a mount that creates a
root-owned directory, a build arg the Dockerfile never declares, a token only
forwarded under one of its two names, a script nobody made executable.

Run directly (`python3 scripts/check-sandbox.py`) or via `make check-sandbox`.
Standard library only.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DOCKERFILE = ROOT / "Dockerfile"
COMPOSE = ROOT / "docker-compose.yml"
MAKEFILE = ROOT / "Makefile"

failures: list[str] = []
skips: list[str] = []


def read(path: Path) -> str | None:
    if not path.exists():
        skips.append(f"{path.relative_to(ROOT)} not found")
        return None
    return path.read_text(encoding="utf-8")


def indented_block(text: str, key: str) -> list[str]:
    """Return the lines nested under `key:` (same or deeper indentation)."""
    lines = text.splitlines()
    for index, line in enumerate(lines):
        match = re.match(rf"^(\s*){re.escape(key)}:\s*$", line)
        if not match:
            continue
        indent = len(match.group(1))
        block: list[str] = []
        for follow in lines[index + 1 :]:
            if not follow.strip() or follow.strip().startswith("#"):
                block.append(follow)
                continue
            if len(follow) - len(follow.lstrip()) <= indent:
                break
            block.append(follow)
        return block
    return []


def phony_targets(text: str) -> set[str]:
    """Collect .PHONY names, following backslash continuations."""
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not line.startswith(".PHONY:"):
            continue
        chunk = ""
        for follow in lines[index:]:
            chunk += follow.rstrip("\\").strip() + " "
            if not follow.rstrip().endswith("\\"):
                break
        return set(chunk.split(":")[1].split())
    return set()


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"{'ok  ' if ok else 'FAIL'}  {name}{f' — {detail}' if detail and not ok else ''}")
    if not ok:
        failures.append(f"{name}: {detail}")


dockerfile = read(DOCKERFILE)
compose = read(COMPOSE)
makefile = read(MAKEFILE)

# --- Dockerfile ---------------------------------------------------------------

if dockerfile is not None:
    lines = dockerfile.splitlines()
    from_index = next((i for i, line in enumerate(lines) if line.startswith("FROM")), None)

    check("Dockerfile has a FROM", from_index is not None)
    check(
        "Dockerfile pins a base image tag",
        bool(re.search(r"^FROM\s+\S+:\S+", dockerfile, re.MULTILINE)),
        "an unpinned base moves under you between builds",
    )

    arg_names = re.findall(r"^ARG\s+([A-Z_][A-Z0-9_]*)", dockerfile, re.MULTILINE)

    if from_index is not None:
        # An ARG declared before the first FROM is in scope only for the FROM
        # lines: every instruction after FROM sees it empty. A download URL built
        # from an unset version 404s at build time in a way no linter catches.
        pre_from = [
            name
            for i, line in enumerate(lines)
            if i < from_index
            for name in re.findall(r"^ARG\s+([A-Z_][A-Z0-9_]*)", line)
        ]
        check(
            "every ARG is declared after the first FROM",
            not pre_from,
            f"declared before FROM: {', '.join(pre_from)}",
        )

    for required in ("GH_CLI_VERSION", "TARGETARCH", "HOST_UID", "HOST_GID"):
        check(f"ARG {required} is declared", required in arg_names)

    check(
        "the runtime user is created from the host uid/gid",
        re.search(r"useradd\s+--uid\s+\$\{HOST_UID\}", dockerfile) is not None,
        "no passwd entry for the host uid means shells say 'I have no name!'",
    )
    check(
        "a uid collision fails the build readably",
        "already used by another account" in dockerfile,
    )
    check(
        "git trusts the bind-mounted workspace",
        "safe.directory /workspace" in dockerfile,
        "a bind mount with foreign ownership trips git's dubious-ownership guard",
    )
    check("the image defaults to the non-root user", re.search(r"^USER devuser", dockerfile, re.MULTILINE) is not None)

    # Every COPY source must exist or the build dies at that layer.
    missing_copies = [
        src
        for src in re.findall(r"^COPY\s+(?:--\S+\s+)*(\S+)", dockerfile, re.MULTILINE)
        if not (ROOT / src).exists()
    ]
    check("every COPY source exists", not missing_copies, f"missing: {', '.join(missing_copies)}")

# --- compose ------------------------------------------------------------------

if compose is not None:
    check("both GitHub token names are forwarded", "GH_TOKEN=${GH_TOKEN" in compose and "GITHUB_TOKEN=${GITHUB_TOKEN" in compose,
          "forwarding only one silently breaks projects that set the other")

    # A pasted real token would authenticate from the image into every project
    # that copies this file; only an interpolation is acceptable.
    literal = re.search(
        r"(?:GH_TOKEN|GITHUB_TOKEN)\s*[:=]\s*['\"]?(?!\$\{)[A-Za-z0-9_-]{30,}",
        compose,
    )
    check("no literal token value is committed", literal is None, "looks like a real token was pasted in")

    port_entries = [
        match.group(1).strip().strip("\"'")
        for line in indented_block(compose, "ports")
        if (match := re.match(r"^\s*-\s*(.+)$", line))
    ]
    check("the dev service publishes a port", bool(port_entries))
    for entry in port_entries:
        host_side, _, container_side = entry.rpartition(":")
        check(f"container port is a literal number ({entry})", container_side.isdigit())
        # Two sandboxes publishing the same host port leaves the second with no
        # network attachment at all, which kills DNS inside it.
        check(f"host port is overridable ({entry})", "${HOST_PORT:-" in host_side,
              "a literal host port collides with a second sandbox")

    check("the workspace is bind-mounted", "/workspace" in compose)

    # Host state (gh, opencode, gitconfig) is mounted in, never written back: a
    # container that can edit the host's gh config can also leak it.
    mounts = [
        match.group(1).strip().strip("\"'")
        for line in indented_block(compose, "volumes")
        if (match := re.match(r"^\s*-\s*(.+)$", line))
    ]
    host_mounts = [mount for mount in mounts if "HOST_HOME" in mount]
    writable = [mount for mount in host_mounts if not mount.endswith(":ro")]
    check("host config mounts exist", bool(host_mounts))
    check("every host-config mount is read-only", not writable,
          f"writable: {', '.join(writable)}")

    # Compose passes these as build args; an arg the Dockerfile never declares is
    # silently dropped, and the image then has no passwd entry for the host uid.
    arg_keys = [
        match.group(1)
        for line in indented_block(compose, "args")
        if (match := re.match(r"^\s+(\w+):", line))
    ]
    check("compose declares build args", bool(arg_keys))
    if dockerfile is not None:
        undeclared = [key for key in arg_keys if f"ARG {key}" not in dockerfile]
        check("every compose build arg is declared in the Dockerfile", not undeclared,
              f"dropped silently: {', '.join(undeclared)}")

    referenced_scripts = set(re.findall(r"(scripts/[\w.-]+\.sh)", compose))
    if dockerfile is not None:
        referenced_scripts |= set(re.findall(r"(scripts/[\w.-]+\.sh)", dockerfile))

# --- Makefile -----------------------------------------------------------------

if makefile is not None:
    required_targets = [
        "preflight",
        "dev-up",
        "dev-down",
        "dev-log",
        "dev-build",
        "dev-shell",
        "dev-opencode",
        "dev-opencode-auto",
        "dev-restart",
        "reset",
        "opencode-version",
        "opencode-upgrade",
        "setup-host",
    ]
    missing = [t for t in required_targets if not re.search(rf"^{re.escape(t)}:", makefile, re.MULTILINE)]
    check("the sandbox targets exist", not missing, f"missing: {', '.join(missing)}")

    check(
        "the sandbox targets are in .PHONY",
        set(required_targets) <= phony_targets(makefile),
        f"missing: {', '.join(sorted(set(required_targets) - phony_targets(makefile)))}",
    )
    # `make opencode` is the documented way in; it must exist as a target even
    # when the longer `dev-opencode` name is the canonical one.
    check("aliases opencode / opencode-auto / shell exist",
          all(re.search(rf"^{a}:", makefile, re.MULTILINE) for a in ("opencode", "opencode-auto", "shell")))
    check("opencode targets support --auto", "OPENCODE_ARGS = --auto" in makefile)

    referenced_scripts |= set(re.findall(r"(scripts/[\w.-]+\.sh)", makefile))

    # The host owns the opencode binary and the sandbox mounts it read-only: an
    # in-container upgrade silently does nothing, so both host targets must exist.
    for target in ("opencode-version", "opencode-upgrade"):
        block = re.search(rf"^{target}:[^\n]*\n((?:\t.*\n)+)", makefile, re.MULTILINE)
        check(f"{target} carries a ## help comment", re.search(rf"^{target}:.*## ", makefile, re.MULTILINE) is not None)

# --- scripts ------------------------------------------------------------------

for rel in sorted(referenced_scripts):
    path = ROOT / rel
    if not path.exists():
        check(f"{rel} exists", False, "referenced but not present")
        continue
    import os

    check(f"{rel} is executable", os.access(path, os.X_OK), "Docker's COPY + compose command needs the bit set")

if skips:
    print("\nskipped: " + "; ".join(skips))

if failures:
    print(f"\n{len(failures)} sandbox check(s) failed:")
    for failure in failures:
        print(f"  - {failure}")
    sys.exit(1)

print("\nall sandbox checks passed")
